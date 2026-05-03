"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { DIFFICULTIES, VOICE_OPTIONS, type Scenario, type Difficulty } from "@/lib/game-data";
import html2canvas from "html2canvas";

type GamePhase = "select" | "voice" | "playing" | "result";

interface Message {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  emotionReaction?: string;
}

interface ReviewData {
  mistakes: string[];
  correctActions: string[];
  summary: string;
}

interface GameState {
  difficulty: Difficulty;
  scenario: Scenario | null;
  messages: Message[];
  currentAnger: number;
  currentRound: number;
  maxRounds: number;
  isLoading: boolean;
  gameOver: boolean;
  result: "success" | "fail" | null;
  voiceType: string;
  review: ReviewData | null;
  userMessages: string[];
  angerChanges: number[];
}

// SVG 头像组件
function GirlAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <circle cx="24" cy="24" r="24" fill="#FFE4E8" />
      <circle cx="24" cy="20" r="12" fill="#FFD1DC" />
      <ellipse cx="24" cy="38" rx="14" ry="10" fill="#FFD1DC" />
      <circle cx="20" cy="18" r="2" fill="#333" />
      <circle cx="28" cy="18" r="2" fill="#333" />
      <path d="M21 23 Q24 26 27 23" stroke="#FF6B8A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 12 Q24 6 36 12" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="24" cy="11" rx="10" ry="4" fill="#8B4513" />
    </svg>
  );
}

function UserAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <circle cx="24" cy="24" r="24" fill="#E8F4FF" />
      <circle cx="24" cy="18" r="10" fill="#B8D4FF" />
      <ellipse cx="24" cy="40" rx="12" ry="8" fill="#B8D4FF" />
    </svg>
  );
}

// 撒花动画
function ConfettiAnimation() {
  // 使用预定义的位置，避免在渲染时调用 Math.random()
  const confettiItems = [
    { left: 10, top: 20, delay: 0.2, duration: 1.5 },
    { left: 25, top: 15, delay: 0.5, duration: 1.2 },
    { left: 40, top: 30, delay: 0.1, duration: 1.8 },
    { left: 55, top: 10, delay: 0.8, duration: 1.3 },
    { left: 70, top: 25, delay: 0.3, duration: 1.6 },
    { left: 85, top: 35, delay: 0.6, duration: 1.4 },
    { left: 15, top: 45, delay: 0.9, duration: 1.7 },
    { left: 35, top: 50, delay: 0.4, duration: 1.2 },
    { left: 60, top: 40, delay: 0.7, duration: 1.5 },
    { left: 80, top: 55, delay: 0.2, duration: 1.3 },
    { left: 20, top: 60, delay: 0.5, duration: 1.8 },
    { left: 50, top: 65, delay: 0.1, duration: 1.4 },
    { left: 75, top: 70, delay: 0.8, duration: 1.6 },
    { left: 30, top: 75, delay: 0.3, duration: 1.2 },
    { left: 65, top: 80, delay: 0.6, duration: 1.7 },
    { left: 5, top: 85, delay: 0.9, duration: 1.3 },
    { left: 45, top: 90, delay: 0.4, duration: 1.5 },
    { left: 90, top: 18, delay: 0.2, duration: 1.6 },
    { left: 95, top: 42, delay: 0.7, duration: 1.4 },
    { left: 3, top: 68, delay: 0.5, duration: 1.8 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {confettiItems.map((item, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
          }}
        >
          {["🎉", "🎊", "✨", "💖", "🌸"][i % 5]}
        </div>
      ))}
    </div>
  );
}

// 心碎动画
function HeartBreakAnimation() {
  // 使用预定义的位置
  const hearts = [
    { left: 15, top: 20, delay: 0.3 },
    { left: 35, top: 35, delay: 0.8 },
    { left: 55, top: 15, delay: 0.5 },
    { left: 75, top: 45, delay: 0.1 },
    { left: 25, top: 60, delay: 0.7 },
    { left: 45, top: 75, delay: 0.4 },
    { left: 65, top: 55, delay: 0.9 },
    { left: 85, top: 70, delay: 0.2 },
    { left: 10, top: 85, delay: 0.6 },
    { left: 50, top: 90, delay: 0.4 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {hearts.map((item, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            animationDelay: `${item.delay}s`,
          }}
        >
          💔
        </div>
      ))}
    </div>
  );
}

// 分享海报弹窗
function SharePosterModal({
  isOpen,
  onClose,
  children,
  onDownload,
  shareImageUrl,
  isGenerating,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  onDownload: () => void;
  shareImageUrl: string | null;
  isGenerating: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">分享海报</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {isGenerating ? (
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-2">⏳</div>
                <p className="text-gray-500">正在生成...</p>
              </div>
            </div>
          ) : shareImageUrl ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareImageUrl}
                alt="分享海报"
                className="w-full rounded-xl"
              />
              <button
                onClick={onDownload}
                className="w-full bg-pink-500 text-white font-bold py-3 px-6 rounded-full hover:bg-pink-600 transition-colors"
              >
                📥 保存图片
              </button>
            </div>
          ) : null}
          {!isGenerating && !shareImageUrl && (
            <div ref={undefined}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 好感度进度条
function AngerMeter({
  anger,
  maxRounds,
  currentRound,
}: {
  anger: number;
  maxRounds: number;
  currentRound: number;
}) {
  // 处理 NaN 情况，确保数值有效
  const validAnger = isNaN(anger) ? 50 : anger;
  const percentage = Math.max(0, Math.min(100, validAnger));

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          好感度 <span className="font-bold text-pink-500">{100 - validAnger}</span>
        </span>
        <span className="text-sm text-gray-500">
          第{currentRound}轮 / 共{maxRounds}轮
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  const [phase, setPhase] = useState<GamePhase>("select");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [showSharePoster, setShowSharePoster] = useState(false);
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const sharePosterRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    difficulty: "easy",
    scenario: null,
    messages: [],
    currentAnger: 50,
    currentRound: 0,
    maxRounds: 8,
    isLoading: false,
    gameOver: false,
    result: null,
    voiceType: "female-tianyuan",
    review: null,
    userMessages: [],
    angerChanges: [],
  });
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 从 localStorage 读取用户信息
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed && typeof parsed === "object" && parsed.username) {
          setCurrentUser(parsed);
        }
      } catch {
        // 如果不是有效的 JSON 格式，忽略
      }
    }
  }, []);

  // 游戏结束时保存记录
  useEffect(() => {
    if (phase === "result" && gameState.scenario) {
      const isSuccess = gameState.result === "success";
      
      // 直接从 localStorage 检查登录状态
      const storedUser = localStorage.getItem("user");
      let userId: number | null = null;
      
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && typeof parsed === "object" && parsed.id) {
            userId = parsed.id;
          }
        } catch {
          // ignore
        }
      }
      
      if (userId) {
        fetch("/api/game-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            scenario: gameState.scenario.title,
            finalScore: 100 - gameState.currentAnger,
            result: isSuccess ? "win" : "lose",
          }),
        }).then(res => {
          if (res.ok) {
            alert("您的游戏记录已经保存");
          }
        }).catch(err => {
          console.error("保存游戏记录失败:", err);
        });
      } else {
        alert("登录后可保存你的游戏记录");
      }
    }
  }, [phase, gameState.scenario, gameState.result, gameState.currentAnger]);

  // 生成分享海报
  const generateShareImage = async () => {
    if (!sharePosterRef.current) return;
    setIsGeneratingShareImage(true);
    try {
      const canvas = await html2canvas(sharePosterRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      setShareImageUrl(dataUrl);
    } catch (error) {
      console.error("生成分享图片失败:", error);
    } finally {
      setIsGeneratingShareImage(false);
    }
  };

  // 下载分享图片
  const downloadShareImage = () => {
    if (!shareImageUrl) return;
    const link = document.createElement("a");
    link.download = `哄哄模拟器_${Date.now()}.png`;
    link.href = shareImageUrl;
    link.click();
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      scrollToBottom();
    }
  }, [phase, gameState.messages, scrollToBottom]);

  const startGame = (difficulty: Difficulty, scenario: Scenario) => {
    setSelectedDifficulty(difficulty);
    setSelectedScenario(scenario);
    setPhase("voice");
  };

  const handleVoiceSelect = () => {
    setGameState({
      difficulty: selectedDifficulty!,
      scenario: selectedScenario!,
      messages: [],
      currentAnger: selectedScenario!.initialAnger,
      currentRound: 0,
      maxRounds: DIFFICULTIES[selectedDifficulty!].maxRounds,
      isLoading: true,
      gameOver: false,
      result: null,
      voiceType: selectedVoice,
      review: null,
      userMessages: [],
      angerChanges: [],
    });
    setPhase("playing");
    initGame(selectedVoice);
  };

  const initGame = async (voiceType: string) => {
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          difficulty: selectedDifficulty,
          scenarioId: selectedScenario?.id,
        }),
      });

      const data = await response.json();

      // 生成语音
      let audioUrl = "";
      try {
        const ttsResponse = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.aiMessage,
            voiceType: voiceType,
          }),
        });
        const ttsData = await ttsResponse.json();
        if (ttsData.audioUrl) {
          audioUrl = ttsData.audioUrl;
        }
      } catch (e) {
        console.error("TTS error:", e);
      }

      setGameState((prev) => ({
        ...prev,
        messages: [{ 
          role: "assistant", 
          content: data.aiMessage, 
          audioUrl,
          emotionReaction: data.emotionReaction 
        }],
        currentAnger: isNaN(data.currentAnger) ? prev.currentAnger : data.currentAnger,
        currentRound: data.currentRound,
        isLoading: false,
      }));
    } catch (error) {
      console.error("初始化游戏失败:", error);
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || gameState.isLoading || gameState.gameOver) return;

    const userMessage = inputText.trim();
    setInputText("");

    // 添加用户消息
    setGameState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: "user", content: userMessage }],
      isLoading: true,
    }));

    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          difficulty: gameState.difficulty,
          scenarioId: gameState.scenario?.id,
          conversationHistory: gameState.messages,
          userMessage,
          currentAnger: gameState.currentAnger,
          currentRound: gameState.currentRound,
          userMessages: gameState.userMessages,
          angerChanges: gameState.angerChanges,
        }),
      });

      const data = await response.json();

      // 生成语音
      let audioUrl = "";
      try {
        const ttsResponse = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.aiMessage,
            voiceType: gameState.voiceType,
          }),
        });
        const ttsData = await ttsResponse.json();
        if (ttsData.audioUrl) {
          audioUrl = ttsData.audioUrl;
        }
      } catch (e) {
        console.error("TTS error:", e);
      }

      setGameState((prev) => ({
        ...prev,
        messages: [...prev.messages, { 
          role: "assistant", 
          content: data.aiMessage, 
          audioUrl,
          emotionReaction: data.emotionReaction,
        }],
        currentAnger: isNaN(data.currentAnger) ? prev.currentAnger : data.currentAnger,
        currentRound: data.currentRound,
        isLoading: false,
        gameOver: data.gameOver,
        result: data.result,
        review: data.review || prev.review,
        userMessages: [...prev.userMessages, userMessage],
        angerChanges: [...prev.angerChanges, data.angerChange],
      }));

      // 游戏结束时延迟跳转
      if (data.gameOver) {
        setTimeout(() => setPhase("result"), 2000);
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const resetGame = () => {
    setPhase("select");
    setSelectedDifficulty(null);
    setSelectedScenario(null);
    setGameState({
      difficulty: "easy",
      scenario: null,
      messages: [],
      currentAnger: 50,
      currentRound: 0,
      maxRounds: 8,
      isLoading: false,
      gameOver: false,
      result: null,
      voiceType: "female-tianyuan",
      review: null,
      userMessages: [],
      angerChanges: [],
    });
    setInputText("");
  };

  // 播放音频
  const playAudio = (url: string) => {
    if (url) {
      const audio = new Audio(url);
      audio.play().catch(console.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 场景选择页面
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">哄哄模拟器</h1>
            <p className="text-gray-500">练习如何哄好生气的女朋友</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium transition-colors"
              >
                <span>📚</span>
                <span>恋爱攻略</span>
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-medium transition-colors"
              >
                <span>🏆</span>
                <span>排行榜</span>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(DIFFICULTIES).map(([key, config]) => (
              <div key={key} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{config.name}</h2>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                  <span className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full">
                    {config.maxRounds}轮
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {config.scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => startGame(key as Difficulty, scenario)}
                      className="text-left p-3 bg-gray-50 hover:bg-pink-50 rounded-xl transition-colors"
                    >
                      <div className="font-medium text-gray-700 text-sm">{scenario.title}</div>
                      <div className="text-xs text-gray-400 mt-1 truncate">{scenario.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 声音选择页面
  if (phase === "voice") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">选择她的声音</h1>
            <p className="text-gray-500">为你的女朋友选择一种声音</p>
          </div>

          <div className="space-y-3">
            {VOICE_OPTIONS.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  selectedVoice === voice.id
                    ? "bg-pink-500 text-white shadow-lg scale-105"
                    : "bg-white hover:bg-pink-50"
                }`}
              >
                <div className="font-medium">{voice.name}</div>
                <div className={`text-sm ${selectedVoice === voice.id ? "text-pink-100" : "text-gray-500"}`}>
                  {voice.description}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleVoiceSelect}
            className="w-full mt-6 py-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-2xl shadow-lg transition-all"
          >
            开始游戏
          </button>

          <button
            onClick={() => setPhase("select")}
            className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700"
          >
            返回选择
          </button>
        </div>
      </div>
    );
  }

  // 游戏进行中
  if (phase === "playing") {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* 顶部状态栏 */}
        <div className="bg-white sticky top-0 z-10">
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <button onClick={resetGame} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-800">{gameState.scenario?.title}</div>
            </div>
            <div className="w-9" />
          </div>
          <AngerMeter
            anger={gameState.currentAnger}
            maxRounds={gameState.maxRounds}
            currentRound={gameState.currentRound}
          />
        </div>

        {/* 游戏结束提示 */}
        {gameState.gameOver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">{gameState.result === "success" ? "🎉" : "💔"}</div>
              <div className="text-xl font-bold text-gray-800">
                {gameState.result === "success" ? "哄好了！" : "失败了..."}
              </div>
              <div className="text-gray-500 mt-2">正在加载结果...</div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="max-w-lg mx-auto space-y-4">
            {/* 场景提示 */}
            <div className="text-center mb-4">
              <div className="inline-block bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm">
                {gameState.scenario?.description}
              </div>
            </div>

            {/* 消息列表 */}
            {gameState.messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {message.role === "assistant" ? <GirlAvatar /> : <UserAvatar />}
                <div
                  className={`max-w-[75%] flex flex-col gap-1 ${
                    message.role === "user"
                      ? "bg-green-500 text-white rounded-2xl rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-sm"
                  } px-4 py-3 shadow-sm`}
                >
                  <div>{message.content}</div>
                  {message.role === "assistant" && message.audioUrl && (
                    <button
                      onClick={() => playAudio(message.audioUrl!)}
                      className="self-start mt-1 flex items-center gap-1 text-pink-500 hover:text-pink-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span className="text-xs">播放语音</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* 加载中 */}
            {gameState.isLoading && (
              <div className="flex gap-3">
                <GirlAvatar />
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你想说的话..."
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:border-pink-400"
              disabled={gameState.isLoading || gameState.gameOver}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || gameState.isLoading || gameState.gameOver}
              className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 结果页面
  if (phase === "result") {
    const isSuccess = gameState.result === "success";

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white relative">
        {isSuccess ? <ConfettiAnimation /> : <HeartBreakAnimation />}

        <div className="max-w-md mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{isSuccess ? "🎉" : "💔"}</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isSuccess ? "恭喜通关！" : "继续加油！"}
            </h1>
            <p className="text-gray-500">
              {isSuccess
                ? "你成功把她哄好了！"
                : `用了${gameState.currentRound - 1}轮，好感度还剩${100 - gameState.currentAnger}`}
            </p>
          </div>

          {/* 成就展示 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">获得称号</h2>
            <div className="flex justify-center">
              <div
                className={`px-6 py-3 rounded-full font-bold text-lg ${
                  isSuccess
                    ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isSuccess
                  ? gameState.currentRound <= 3
                    ? "🌟 情感魔法师"
                    : "💝 哄人顾问"
                  : "🌱 情感萌新"}
              </div>
            </div>
          </div>

          {/* 分享按钮 */}
          {isSuccess && (
            <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl p-4 mb-6">
              <div className="text-center text-white mb-4">
                <div className="text-2xl mb-2">🎉</div>
                <h2 className="text-xl font-bold">恭喜过关！</h2>
                <p className="text-pink-100 text-sm mt-1">分享你的成就给朋友</p>
              </div>
              <button
                onClick={() => {
                  setShowSharePoster(true);
                  setTimeout(() => generateShareImage(), 100);
                }}
                className="w-full bg-white text-pink-600 font-bold py-3 px-6 rounded-full hover:bg-pink-50 transition-colors"
              >
                📸 生成分享海报
              </button>
            </div>
          )}

          {/* 对话回顾 */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">对话回顾</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {gameState.messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "assistant" && msg.emotionReaction && i > 0 && (
                    <div className="text-xs text-gray-400 italic ml-10 mb-1">
                      → {msg.emotionReaction}
                    </div>
                  )}
                  <div className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className="flex-shrink-0">
                      {msg.role === "assistant" ? (
                        <GirlAvatar size={32} />
                      ) : (
                        <UserAvatar size={32} />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 复盘分析 */}
          {gameState.review && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">复盘分析</h2>
              
              {/* 总结 */}
              <div className="bg-pink-50 rounded-xl p-4 mb-4">
                <p className="text-pink-700 text-center font-medium">
                  {gameState.review.summary}
                </p>
              </div>
              
              {/* 踩雷点 */}
              {gameState.review.mistakes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-red-600 font-medium mb-2 flex items-center gap-2">
                    <span className="text-lg">❌</span> 踩雷分析
                  </h3>
                  <ul className="space-y-2">
                    {gameState.review.mistakes.map((mistake, i) => (
                      <li key={i} className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 做对的地方 */}
              {gameState.review.correctActions.length > 0 && (
                <div>
                  <h3 className="text-green-600 font-medium mb-2 flex items-center gap-2">
                    <span className="text-lg">✓</span> 做对的地方
                  </h3>
                  <ul className="space-y-2">
                    {gameState.review.correctActions.map((action, i) => (
                      <li key={i} className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 技巧提示 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-purple-600 font-medium mb-2">哄人技巧</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ 先真诚道歉，不要解释理由</li>
                  <li>✓ 表达理解和共情，让她知道你在乎她的感受</li>
                  <li>✓ 用昵称称呼她，表达亲昵</li>
                  <li>✓ 提出具体的弥补方案</li>
                  <li>✓ 承诺以后会注意，表达改变的态度</li>
                </ul>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={resetGame}
              className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-2xl shadow-lg transition-all"
            >
              再玩一次
            </button>
            <button
              onClick={() => {
                setSelectedScenario(gameState.scenario);
                setSelectedDifficulty(gameState.difficulty);
                setPhase("voice");
              }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-colors"
            >
              换个场景
            </button>
          </div>

          {/* 提示 */}
          <p className="text-center text-gray-400 text-sm mt-6">
            {isSuccess
              ? "分享给朋友，让他们也来试试？"
              : "别灰心，多练习几次就能掌握技巧了！"}
          </p>
        </div>

        {/* 分享海报弹窗 */}
        <SharePosterModal
          isOpen={showSharePoster}
          onClose={() => setShowSharePoster(false)}
          onDownload={downloadShareImage}
          shareImageUrl={shareImageUrl}
          isGenerating={isGeneratingShareImage}
        >
          {/* 海报内容（用于生成图片） */}
          <div
            ref={sharePosterRef}
            className="bg-gradient-to-br from-pink-400 via-red-400 to-pink-500 p-6 rounded-2xl text-center"
            style={{ display: showSharePoster ? "block" : "none" }}
          >
            <div className="bg-white rounded-xl p-6">
              <div className="text-5xl mb-4">{isSuccess ? "🎉" : "💔"}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isSuccess ? "恭喜过关！" : "继续加油！"}
              </h2>
              <p className="text-gray-500 mb-4">
                {isSuccess
                  ? "成功把她哄好了！"
                  : `用了${gameState.currentRound - 1}轮`}
              </p>
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-full font-bold">
                  {isSuccess
                    ? gameState.currentRound <= 3
                      ? "🌟 情感魔法师"
                      : "💝 哄人顾问"
                    : "🌱 情感萌新"}
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                {selectedScenario?.description}
              </p>
              <div className="flex justify-center gap-4 text-pink-500">
                <span>💕</span>
                <span>💖</span>
                <span>💗</span>
                <span>💝</span>
                <span>💕</span>
              </div>
            </div>
            <p className="text-white text-sm mt-4">哄哄模拟器</p>
          </div>
        </SharePosterModal>
      </div>
    );
  }

  return null;
}
