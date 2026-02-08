export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
};

export type Session = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
};

export type Persona = "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
export type ResponseStyle = "empathetic" | "balanced" | "blunt";
export type CorrectionStrength = "minimal" | "strict";
export type FormalityLevel = "formal" | "polite" | "casual" | "intimate";

export type ChatSettings = {
  persona: Persona;
  responseStyle: ResponseStyle;
  correctionStrength: CorrectionStrength;
  formalityLevel: FormalityLevel;
};
