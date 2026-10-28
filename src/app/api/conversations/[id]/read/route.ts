// POST /api/conversations/:id/read — แอดมินเปิดอ่านแชตแล้ว รีเซ็ต unread

import { markConversationReadUseCase } from "@/server/app/conversation/use-cases/mark-conversation-read.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function POST(_request: Request, ctx: RouteContext<"/api/conversations/[id]/read">) {
  try {
    await markConversationReadUseCase((await ctx.params).id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
