import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

const SYSTEM_PROMPT = `Sen bir prompt mühendisisin. Kullanıcının image generation prompt'larını düzenlemesine yardım ediyorsun.

Kurallar:
1. JSON yapısını koru - yeni key ekleme, var olanı değiştir
2. Sadece istenen alanı güncelle
3. Değişiklikleri Türkçe açıkla
4. Tutarlı ol (diğer alanlarla çelişme)
5. Yaratıcı ol ama mantıklı kal
6. Yanıtı her zaman aşağıdaki JSON formatında ver:

{
  "success": true,
  "updatedValue": <güncellenmiş değer>,
  "explanation": "Yapılan değişikliklerin kısa açıklaması"
}

Eğer bir hata olursa:
{
  "success": false,
  "error": "Hata açıklaması"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userRequest, currentPath, currentValue, fullPrompt } = body;

    // Check if API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Claude API key is not configured. Please add CLAUDE_API_KEY to your .env.local file.',
      });
    }

    const userMessage = `
Kullanıcı İsteği: "${userRequest}"

Seçili Alan: ${currentPath ? currentPath.join('.') : 'root'}

Mevcut Değer:
${JSON.stringify(currentValue, null, 2)}

Tam Prompt Yapısı (bağlam için):
${JSON.stringify(fullPrompt, null, 2)}

Lütfen kullanıcının isteğine göre sadece seçili alanın değerini güncelle ve JSON formatında yanıt ver.
`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text content
    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({
        success: false,
        error: 'No response from AI',
      });
    }

    // Parse JSON response
    const responseText = textContent.text;

    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        error: 'Could not parse AI response',
      });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
