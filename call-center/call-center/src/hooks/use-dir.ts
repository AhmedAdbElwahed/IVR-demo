import { useLocale } from "next-intl";

type Dir = "rtl" | "ltr";
type Align = "right" | "left";
type AlignDir = "start" | "end";

interface UseDirReturn {
  locale: string;
  dir: Dir;
  align: Align;
  alignDir: AlignDir;
  isAr: boolean;
  isEn: boolean;
}

function useDir(): UseDirReturn {
  const locale = useLocale();
  const isAr = locale === "ar";

  return {
    locale,
    dir: isAr ? "rtl" : "ltr",
    align: isAr ? "right" : "left",
    alignDir: isAr ? "end" : "start",
    isAr,
    isEn: !isAr,
  };
}

export default useDir;
