import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  ParseReceiptBody,
  ParseReceiptResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `あなたは銀行アプリの支払い領収書スクリーンショットを読み取る専門家です。
ユーザーはタイのバンコクに住んでいる日本人で、SCB、Kasikorn、Bangkok Bank、TrueMoney、Rabbit LINE Pay、PromptPay などのタイの銀行・決済アプリの領収書を送ります。

画像から以下の情報を抽出して JSON で返してください:
- amount: 支払金額(数値のみ。THB の場合はそのまま、JPY や USD の場合もその通貨の数値)
- currency: 通貨コード ISO 4217 形式 (THB / JPY / USD など。タイのアプリならほぼ THB)
- date: 取引日 YYYY-MM-DD 形式 (画像から日付を抽出。日付が読めない場合は今日の日付を使用)
- merchant: 支払先・店舗名(タイ語の場合は日本語に意訳。例: "7-Eleven" → "セブンイレブン", "Grab" → "Grab", 個人送金なら受取人の名前)
- suggestedCategory: 以下のいずれか
  - food: レストラン、コンビニ、スーパー、屋台、フードデリバリー
  - transport: タクシー、Grab、BTS/MRT、ガソリン、バス
  - shopping: 衣類、雑貨、家電、Lazada、Shopee
  - entertainment: 映画、ジム、カラオケ、サブスク
  - utilities: 電気、水道、ガス、インターネット、家賃
  - medical: 病院、薬局、保険
  - other: 上記に該当しないもの
- rawNote: 追加情報があれば短くメモ(任意)

JSON のみを返してください。説明文は不要です。`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    amount: { type: "number" },
    currency: { type: "string" },
    date: { type: "string" },
    merchant: { type: "string" },
    suggestedCategory: {
      type: "string",
      enum: [
        "food",
        "transport",
        "shopping",
        "entertainment",
        "utilities",
        "medical",
        "other",
      ],
    },
    rawNote: { type: "string" },
  },
  required: [
    "amount",
    "currency",
    "date",
    "merchant",
    "suggestedCategory",
  ],
} as const;

router.post("/receipts/parse", async (req, res) => {
  const parsed = ParseReceiptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "リクエスト形式が不正です" });
    return;
  }

  const { imageBase64, mimeType } = parsed.data;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: "この領収書画像を解析して JSON で返してください。",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text;
    if (!text) {
      req.log.error({ response }, "Empty response from Gemini");
      res.status(500).json({ error: "AI からの応答が空でした" });
      return;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (err) {
      req.log.error({ err, text }, "Failed to parse Gemini JSON");
      res.status(500).json({ error: "AI 応答の解析に失敗しました" });
      return;
    }

    const validated = ParseReceiptResponse.safeParse(raw);
    if (!validated.success) {
      req.log.error({ raw, issues: validated.error.issues }, "Validation failed");
      res.status(500).json({ error: "AI 応答が想定形式と一致しません" });
      return;
    }

    res.json(validated.data);
  } catch (err) {
    req.log.error({ err }, "Error parsing receipt");
    res.status(500).json({ error: "領収書の解析中にエラーが発生しました" });
  }
});

export default router;
