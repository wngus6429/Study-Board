"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLanguageStore } from "@/app/store/languageStore";
import { translateKoreanText } from "@/app/i18n/translations";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];

function shouldSkipElement(element: Element | null): boolean {
  if (!element) {
    return true;
  }

  return SKIP_TAGS.has(element.tagName) || Boolean(element.closest("[data-i18n-skip]"));
}

function translateElement(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => {
    if (shouldSkipElement(node.parentElement)) {
      return;
    }

    const currentValue = node.nodeValue ?? "";
    const translated = translateKoreanText(currentValue);
    if (translated !== currentValue) {
      node.nodeValue = translated;
    }
  });

  if (root instanceof Element) {
    const elements = [root, ...Array.from(root.querySelectorAll("*"))];
    elements.forEach((element) => {
      if (shouldSkipElement(element)) {
        return;
      }

      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        const currentValue = element.getAttribute(attribute);
        if (!currentValue) {
          return;
        }

        const translated = translateKoreanText(currentValue);
        if (translated !== currentValue) {
          element.setAttribute(attribute, translated);
        }
      });
    });
  }
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language);
  const rafId = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(language !== "ja");

  useEffect(() => {
    document.documentElement.lang = language;
    setIsReady(language !== "ja");

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    if (language !== "ja") {
      return;
    }

    const scheduleTranslation = () => {
      if (rafId.current) {
        return;
      }

      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        translateElement(document.body);
        setIsReady(true);
      });
    };

    scheduleTranslation();

    const observer = new MutationObserver(scheduleTranslation);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });

    return () => {
      observer.disconnect();
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [language]);

  return (
    <div key={language} style={{ visibility: isReady ? "visible" : "hidden" }}>
      {children}
    </div>
  );
}
