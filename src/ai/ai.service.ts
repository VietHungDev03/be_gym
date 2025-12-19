import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatRequestDto } from './dto/chat.dto';

@Injectable()
export class AiService {
  private technicalKeywords = ['kỹ thuật', 'chi tiết', 'phân tích', 'root cause', 'detailed', 'technical'];
  private modelName = 'gemini-2.5-flash';
  private genAI?: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async buildReply(payload: ChatRequestDto): Promise<{ message: string }> {
    const mode = this.detectMode(payload);
    const contextText = this.formatContext(payload.context);
    const message = payload.message.trim();

    const systemPrompt = [
      'Bạn là trợ lý AI bảo trì thiết bị gym. Trả lời bằng tiếng Việt.',
      '- Chế độ chat: thân thiện, ngắn gọn, hướng dẫn an toàn và thao tác nhanh.',
      '- Chế độ technical: phân tích sâu, checklist cho kỹ thuật viên/admin.',
      '- Không yêu cầu dữ liệu cấu trúc, không placeholder, luôn đưa ra hành động thực tế.',
    ].join('\n');

    const userPrompt = [
      `Chế độ: ${mode}`,
      `Nội dung: ${message}`,
      contextText ? `Ngữ cảnh: ${contextText}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (!this.genAI) {
      return { message: this.buildFallback(mode, message, contextText) };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
      });
      const text = result?.response?.text?.() || this.buildFallback(mode, message, contextText);
      return { message: text };
    } catch (error) {
      console.warn('Gemini call failed, using fallback', error);
      return { message: this.buildFallback(mode, message, contextText) };
    }
  }

  private detectMode(payload: ChatRequestDto): 'chat' | 'technical' {
    if (payload.mode === 'technical') return 'technical';
    if (payload.mode === 'chat') return 'chat';
    const lower = payload.message.toLowerCase();
    const hasTechWord = this.technicalKeywords.some((kw) => lower.includes(kw));
    return hasTechWord ? 'technical' : 'chat';
  }

  private formatContext(ctx?: Record<string, unknown>): string {
    if (!ctx) return '';
    try {
      return Object.entries(ctx)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    } catch (_err) {
      return '';
    }
  }

  private buildFallback(mode: 'chat' | 'technical', message: string, contextText: string): string {
    if (mode === 'technical') {
      return [
        'Chế độ kỹ thuật (fallback):',
        `- Vấn đề: ${message}`,
        contextText ? `- Ngữ cảnh: ${contextText}` : null,
        '',
        'Chẩn đoán gợi ý:',
        '- Ngắt điện, treo cảnh báo; kiểm tra tiếng ồn/mùi lạ/nhiệt cao.',
        '- Rà belt/cáp/bearing/bushing, siết ốc, kiểm tra lệch trục.',
        '- Kiểm tra kết nối lỏng/oxi hóa, dây nguồn, quạt làm mát.',
        '',
        'Hành động:',
        '- Làm sạch, bôi trơn; thay belt/bearing nếu mòn hoặc rung cao.',
        '- Nếu vẫn bất thường: dừng máy, lập ticket ưu tiên cao, chuẩn bị phụ tùng liên quan.',
      ]
        .filter(Boolean)
        .join('\n');
    }

    return [
      'Hướng dẫn nhanh (fallback):',
      `- Vấn đề: ${message}`,
      contextText ? `- Lưu ý: ${contextText}` : null,
      '- Dừng máy nếu có tiếng ồn/mùi lạ/nhiệt cao.',
      '- Lau sạch, siết ốc, kiểm tra belt/cáp/bearing; bôi trơn.',
      '- Nếu chưa ổn: tạm ngưng và báo kỹ thuật.',
    ]
      .filter(Boolean)
      .join('\n');
  }

}
