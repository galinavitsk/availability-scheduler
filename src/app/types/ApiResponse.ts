export enum ApiStatus {
    Success = 200,
    Info = 201,
    Failure = 400,
    NoData = 204,
}

export enum ApiResponseType {
    Success = 10,
    PartialSuccess = 20,
    Error = 30
}

export type ApiResponse = {
    status: ApiStatus,
    message?: string,
    data?: any,
    code?: number
};
