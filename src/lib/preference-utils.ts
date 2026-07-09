export interface ParsedPreference {
  hasPreference: boolean;
  onBoi: boolean;
  hocBoi: boolean;
  bongRo: boolean;
  cauLong: boolean;
}

export function parsePreference(preferenceStr: string | null | undefined): ParsedPreference {
  if (!preferenceStr) {
    return {
      hasPreference: false,
      onBoi: false,
      hocBoi: false,
      bongRo: false,
      cauLong: false
    };
  }

  const str = preferenceStr.toLowerCase();
  
  return {
    hasPreference: true,
    onBoi: str.includes("ôn bơi"),
    hocBoi: str.includes("học bơi"),
    bongRo: str.includes("bóng rổ"),
    cauLong: str.includes("cầu lông")
  };
}
