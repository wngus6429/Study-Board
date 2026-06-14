"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLanguageStore } from "@/app/store/languageStore";
import { translateKoreanText } from "@/app/i18n/translations";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);
const TRANSLATABLE_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
const INITIAL_TRANSLATION_DELAY_MS = 250;

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
  const timeoutId = useRef<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const isTranslatingRef = useRef(false);
  const [isReady, setIsReady] = useState(language !== "ja");

  useEffect(() => {
    document.documentElement.lang = language;

    const clearPendingTranslation = () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }

      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    observerRef.current?.disconnect();
    observerRef.current = null;
    clearPendingTranslation();

    if (language !== "ja") {
      setIsReady(true);
      return;
    }

    setIsReady(false);

    const scheduleTranslation = (delay: number, hideUntilTranslated = false) => {
      if (hideUntilTranslated) {
        setIsReady(false);
      }

      clearPendingTranslation();

      timeoutId.current = window.setTimeout(() => {
        timeoutId.current = null;
        rafId.current = window.requestAnimationFrame(() => {
          rafId.current = null;
          translateElement(document.body);
          setIsReady(true);
        });
      }, delay);
    };

    scheduleTranslation(INITIAL_TRANSLATION_DELAY_MS, true);

    const observer = new MutationObserver((records) => {
      if (isTranslatingRef.current) {
        return;
      }

      isTranslatingRef.current = true;

      try {
        const targets = new Set<ParentNode>();
        records.forEach((record) => {
          if (record.type === "childList") {
            record.addedNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                targets.add(node.parentElement);
              }

              if (node instanceof Element) {
                targets.add(node);
              }
            });
            return;
          }

          if (record.type === "characterData" && record.target.parentElement) {
            targets.add(record.target.parentElement);
            return;
          }

          if (record.type === "attributes" && record.target instanceof Element) {
            targets.add(record.target);
          }
        });

        targets.forEach((target) => translateElement(target));
      } finally {
        isTranslatingRef.current = false;
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
      clearPendingTranslation();
    };
  }, [language]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }

      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  return (
    <div key={language} style={{ visibility: isReady ? "visible" : "hidden" }}>
      {children}
    </div>
  );
}
