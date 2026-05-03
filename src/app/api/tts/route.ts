import { NextRequest, NextResponse } from "next/server";
import { TTSClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import axios from "axios";

// 可用的声音列表
export const VOICE_OPTIONS = [
  { id: "zh_female_meilinvyou_saturn_bigtts", name: "温柔女声", description: "甜美温柔的女朋友声音" },
  { id: "zh_female_xiaohe_uranus_bigtts", name: "俏皮女声", description: "活泼俏皮的女声" },
  { id: "saturn_zh_female_keainvsheng_tob", name: "可爱女声", description: "可爱软萌的女友声音" },
  { id: "zh_female_vv_uranus_bigtts", name: "知性女声", description: "温柔知性的女声" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speaker, voiceType, uid } = body;
    // 支持 voiceType 和 speaker 两种参数名
    const selectedSpeaker = speaker || voiceType || "zh_female_meilinvyou_saturn_bigtts";

    if (!text) {
      return NextResponse.json({ error: "缺少文本内容" }, { status: 400 });
    }

    try {
      const config = new Config();
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      const client = new TTSClient(config, customHeaders);

      const response = await client.synthesize({
        uid: uid || `tts-${Date.now()}`,
        text,
        speaker: selectedSpeaker,
        audioFormat: "mp3",
        sampleRate: 24000,
      });

      // 获取音频数据并转换为 base64
      const audioData = await axios.get(response.audioUri, {
        responseType: "arraybuffer",
      });
      const audioBase64 = Buffer.from(audioData.data).toString("base64");
      const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;

      return NextResponse.json({
        audioUrl: audioDataUrl,
        audioSize: response.audioSize,
      });
    } catch (ttsError) {
      console.error("TTS API Error (fallback to no audio):", ttsError);
      // 当 TTS API 不可用时，返回空的 audioUrl，前端会隐藏播放按钮
      return NextResponse.json({
        audioUrl: "",
        audioSize: 0,
      });
    }
  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json({
      audioUrl: "",
      audioSize: 0,
    });
  }
}
