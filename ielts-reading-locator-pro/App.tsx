
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameData, GameStatus } from './types';
import { generateIELTSExercise } from './services/geminiService';
import { Button } from './components/Button';

const INITIAL_TIME = 90; // 1.5 minutes in seconds

const App: React.FC = () => {
  const [data, setData] = useState<GameData | null>(null);
  const [status, setStatus] = useState<GameStatus>('loading');
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<number>>(new Set());
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME);
  // Use ReturnType<typeof setInterval> to avoid NodeJS namespace error in browser environments
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNewExercise = useCallback(async () => {
    setStatus('loading');
    setIsCorrect(null);
    setSelectedParagraphs(new Set());
    setTimeLeft(INITIAL_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      const exercise = await generateIELTSExercise();
      setData(exercise);
      setStatus('playing');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchNewExercise();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNewExercise]);

  // Timer logic
  useEffect(() => {
    if (status === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (status !== 'playing' || timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && status === 'playing') {
      // Auto-submit or show timeout state
      handleSubmit();
    }
  }, [timeLeft, status]);

  const toggleParagraph = (index: number) => {
    // Không cho chọn nếu đã nộp bài hoặc hết giờ
    if (status !== 'playing' || timeLeft === 0) return;
    
    const next = new Set(selectedParagraphs);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedParagraphs(next);
  };

  const handleSubmit = () => {
    if (!data) return;
    
    const correctIndices = data.question.correctParagraphIndices;
    const selectedArray = Array.from(selectedParagraphs);
    
    const hasAllCorrect = correctIndices.every(idx => selectedParagraphs.has(idx));
    const hasNoExtras = selectedArray.every(idx => correctIndices.includes(idx));
    
    setIsCorrect(hasAllCorrect && hasNoExtras);
    setStatus('submitted');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerColorClass = timeLeft <= 15 ? 'text-red-500 border-red-200 bg-red-50' : 
                         timeLeft <= 45 ? 'text-amber-500 border-amber-200 bg-amber-50' : 
                         'text-emerald-600 border-emerald-200 bg-emerald-50';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mt-8">Đang soạn bài tập...</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">
          Gemini đang tạo một bài đọc 1000 từ và câu hỏi IELTS cho bạn. Vui lòng đợi trong giây lát.
        </p>
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lỗi Kết Nối</h2>
          <p className="text-slate-500 mb-6">Không thể tạo nội dung bài tập lúc này. Hãy thử lại.</p>
          <Button onClick={fetchNewExercise} className="w-full">Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900 leading-none">IELTS Reading</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Luyện kỹ năng tìm dẫn chứng</p>
            </div>
          </div>

          {/* Timer Section */}
          <div className={`flex items-center gap-2 px-4 py-2 border-2 rounded-2xl font-mono text-xl font-black transition-all duration-300 ${timerColorClass}`}>
            <svg className={`w-5 h-5 ${timeLeft <= 15 ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchNewExercise}>Bài mới</Button>
            {status === 'playing' && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSubmit}
                disabled={selectedParagraphs.size === 0 || timeLeft === 0}
              >
                Nộp bài
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
        
        {/* Left: Reading Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[75vh] lg:h-[80vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {data.passage.title}
              </h2>
              <div className="text-xs font-bold text-slate-400 bg-white border px-3 py-1 rounded-full">
                ~1000 WORDS
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar reading-text text-slate-800 ${status === 'playing' && timeLeft === 0 ? 'pointer-events-none grayscale' : ''}`}>
              {data.passage.paragraphs.map((para, idx) => {
                const isSelected = selectedParagraphs.has(idx);
                const isCorrectPara = data.question.correctParagraphIndices.includes(idx);
                
                let stateClass = "bg-white border-transparent";
                if (status === 'submitted') {
                  if (isCorrectPara) {
                    stateClass = "bg-emerald-50 border-emerald-400 ring-4 ring-emerald-100";
                  } else if (isSelected && !isCorrectPara) {
                    stateClass = "bg-red-50 border-red-400 ring-4 ring-red-100 opacity-60";
                  } else {
                    stateClass = "bg-white border-transparent opacity-40";
                  }
                } else if (isSelected) {
                  stateClass = "bg-blue-50 border-blue-400 ring-4 ring-blue-100 scale-[1.01]";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => toggleParagraph(idx)}
                    className={`
                      relative p-6 mb-8 rounded-2xl border-2 transition-all duration-300
                      ${status === 'playing' && timeLeft > 0 ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
                      ${stateClass}
                      group
                    `}
                  >
                    <span className={`
                      absolute -left-3 -top-3 w-8 h-8 flex items-center justify-center rounded-xl font-bold text-sm border-2 transition-colors duration-300
                      ${isSelected || isCorrectPara ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-200 shadow-sm"}
                    `}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <p className="text-xl leading-[1.8] text-slate-700">{para}</p>
                    
                    {status === 'playing' && timeLeft > 0 && !isSelected && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-blue-500 font-bold text-xs uppercase tracking-widest">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        Chọn đoạn này
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Question Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 sticky top-28 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                {data.question.type}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Tìm dẫn chứng</h3>
              
              {timeLeft === 0 && status !== 'submitted' && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 flex items-center gap-3 animate-bounce">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-bold">Đã hết thời gian!</span>
                </div>
              )}

              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Đọc kỹ câu hỏi bên dưới và click chọn (highlight) những đoạn văn chứa thông tin trả lời cho câu hỏi này. Bạn có 1.5 phút.
              </p>

              <div className="bg-slate-50 rounded-[1.5rem] p-6 border-2 border-slate-100 mb-8 shadow-inner relative">
                <svg className="absolute -top-3 -left-2 w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H14.017C13.4647 8 13.017 8.44772 13.017 9V15C13.017 17.2091 14.8079 19 17.017 19H17.017V21H14.017ZM4.017 21L4.017 18C4.017 16.8954 4.91243 16 6.017 16H9.017C9.56928 16 10.017 15.5523 10.017 15V9C10.017 8.44772 9.56928 8 9.017 8H4.017C3.46472 8 3.017 8.44772 3.017 9V15C3.017 17.2091 4.80786 19 7.017 19H7.017V21H4.017Z" /></svg>
                <p className="text-lg font-bold text-slate-800 leading-snug">
                  {data.question.questionText}
                </p>
              </div>

              {status === 'playing' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="bg-blue-600 text-white p-1 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-xs text-blue-700 font-medium">Bạn đã chọn {selectedParagraphs.size} đoạn văn.</p>
                  </div>
                  <Button 
                    className="w-full py-4 shadow-xl shadow-blue-100" 
                    onClick={handleSubmit}
                    disabled={selectedParagraphs.size === 0 || timeLeft === 0}
                  >
                    Kiểm tra kết quả
                  </Button>
                </div>
              )}

              {status === 'submitted' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className={`p-6 rounded-[1.5rem] border-2 flex items-start gap-4 ${
                    isCorrect 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800 shadow-lg shadow-emerald-50" 
                      : "bg-red-50 border-red-100 text-red-800 shadow-lg shadow-red-50"
                  }`}>
                    <div className={`p-2 rounded-2xl ${isCorrect ? "bg-emerald-500" : "bg-red-500"} text-white mt-1 shadow-lg`}>
                      {isCorrect ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-xl">
                        {timeLeft === 0 && !isCorrect ? "Hết giờ!" : isCorrect ? "Chính xác!" : "Sai rồi!"}
                      </h4>
                      <p className="text-sm font-medium mt-1 opacity-80">
                        {isCorrect 
                          ? "Tuyệt vời, bạn đã tìm đúng vị trí dẫn chứng." 
                          : "Dẫn chứng nằm ở đoạn: " + data.question.correctParagraphIndices.map(i => String.fromCharCode(65 + i)).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                      <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest">Giải thích chi tiết</h5>
                    </div>
                    <div className="mb-4 text-sm font-bold text-blue-600">
                      Đáp án câu hỏi: {data.question.answer}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed font-medium">
                      {data.question.explanation}
                    </p>
                  </div>

                  <Button variant="secondary" className="w-full py-4 shadow-lg" onClick={fetchNewExercise}>
                    Tiếp tục bài khác
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,#fff_0%,transparent_100%)]"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-yellow-400 p-1.5 rounded-lg text-slate-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </span>
                <h4 className="font-black text-sm uppercase tracking-widest">Mẹo IELTS</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                "Kỹ thuật Scanning là cực kỳ quan trọng. Hãy tìm các từ khóa đặc biệt như Tên riêng, Con số, hoặc Thuật ngữ chuyên ngành trong đoạn văn để xác định vùng chứa đáp án nhanh nhất."
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            System Status: Optimal
          </div>
          <div>&copy; 2024 IELTS READING LOCATOR PRO &middot; AI CONTENT GENERATION</div>
          <div>VER 1.2.1 (TIMER UPDATED)</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
