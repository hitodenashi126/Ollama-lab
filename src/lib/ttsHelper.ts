import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export async function speakHelper(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    voiceURI?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: any) => void;
  } = {}
) {
  const { rate = 1.0, pitch = 1.0, voiceURI, onStart, onEnd, onError } = options;

  if (Capacitor.isNativePlatform()) {
    try {
      if (onStart) onStart();
      // Use Capacitor native plugin
      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate,
        pitch,
        volume: 1.0,
      });
      if (onEnd) onEnd();
      return;
    } catch (err) {
      console.error('Capacitor native TextToSpeech error:', err);
      if (onError) onError(err);
      return;
    }
  }

  // Classic Browser Fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voiceURI) {
        const matchingVoice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceURI);
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (e) => {
        if (onError) onError(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Browser speech synthesis failed:', err);
      if (onError) onError(err);
    }
  } else {
    const errMsg = 'Text to Speech not supported in this browser environment.';
    console.warn(errMsg);
    if (onError) onError(new Error(errMsg));
  }
}

export async function stopHelper() {
  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.stop();
    } catch (err) {
      console.error('Capacitor native TextToSpeech stop error:', err);
    }
  }
  
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
