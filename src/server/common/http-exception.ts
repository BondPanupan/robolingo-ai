// error ที่ use-case โยนได้พร้อม HTTP status — route handler แปลงเป็น JSON { error } ด้วย toErrorResponse

export class HttpException extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpException";
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

/** ระบบภายนอก (LINE) ตอบ error — บอกสาเหตุให้แอดมินเห็นในปุ่ม retry */
export class BadGatewayException extends HttpException {
  constructor(message = "Bad gateway") {
    super(message, 502);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message = "Service unavailable") {
    super(message, 503);
  }
}
