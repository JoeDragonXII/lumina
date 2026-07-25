export const INTRO_STORAGE_KEY = "photo-archive:intro-seen:v1";

export function shouldShowPublicIntro(pathname: string, storedValue: string | null): boolean {
  return pathname === "/" && storedValue !== "1";
}
