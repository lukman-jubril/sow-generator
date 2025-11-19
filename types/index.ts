export interface RecentFile {
  id: string;
  name: string;
  timestamp: string;
  size: string;
  content?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}
