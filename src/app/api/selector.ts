import { ApiResponse, ApiStatus } from "../types/ApiResponse";
import { ApiHost } from "./util";

export const GetSession=async (slug:string): Promise<ApiResponse>=>{
    const response = await fetch(`${ApiHost}sessions/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res=await response.json()
  
    if (!response.ok) {
      return  { status: ApiStatus.Failure, message: res.message }
    }
  return {status:ApiStatus.Success, message: res.message, data: res.data}
}