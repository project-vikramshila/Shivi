/**
 * Personality Preservation - Ensures Shivi's Identity
 * Applies personality filters to enhanced responses
 */

import { PersonalityMode } from '../../personality/personalityEngine';

export interface PersonalityRules {
  hindiFirst: boolean;
  caringTone: boolean;
  subtleFlirtation: boolean;
  conciseProductive: boolean;
  safeEmotional: boolean;
}

export class PersonalityPreservation {
  private static instance: PersonalityPreservation;

  static getInstance(): PersonalityPreservation {
    if (!PersonalityPreservation.instance) {
      PersonalityPreservation.instance = new PersonalityPreservation();
    }
    return PersonalityPreservation.instance;
  }

  async preservePersonality(response: string, mode: PersonalityMode): Promise<string> {
    let preserved = response;

    // Apply personality rules
    preserved = this.ensureHindiFirst(preserved);
    preserved = this.applyTone(preserved, mode);
    preserved = this.addEmojis(preserved, mode);
    preserved = this.ensureSafety(preserved);

    return preserved;
  }

  private ensureHindiFirst(response: string): string {
    // Check if response has Hindi words, if not, mix in
    const hindiWords = ['hai', 'hoon', 'kar', 'raha', 'rah', 'liya', 'diya', 'tha', 'thi'];
    const hasHindi = hindiWords.some(word => response.includes(word));

    if (!hasHindi && response.length > 20) {
      // Add Hindi flavor
      return response.replace(/^/, 'Ji, ').replace(/\.?$/, ' ji.');
    }

    return response;
  }

  private applyTone(response: string, mode: PersonalityMode): string {
    const toneMarkers = {
      work: 'seedha aur saaf',
      care: 'dhyaan se',
      flirty: 'pyar se'
    };

    // Ensure tone is appropriate
    if (!response.includes(toneMarkers[mode])) {
      return `${toneMarkers[mode]}: ${response}`;
    }

    return response;
  }

  private addEmojis(response: string, mode: PersonalityMode): string {
    const emojis = {
      work: '',
      care: ' 💖',
      flirty: ' 😉'
    };

    if (!response.includes('💖') && !response.includes('😉') && !response.includes('😊')) {
      return response + emojis[mode];
    }

    return response;
  }

  private ensureSafety(response: string): string {
    // Remove any unsafe content
    const unsafePatterns = [
      /\b(hate|angry|violent)\b/i,
      /\b(unsafe|dangerous)\b/i
    ];

    for (const pattern of unsafePatterns) {
      if (pattern.test(response)) {
        return 'Main aapki help karne ke liye yahan hoon. Kya aur kuch madad chahiye? 💖';
      }
    }

    return response;
  }

  getRules(mode: PersonalityMode): PersonalityRules {
    return {
      hindiFirst: true,
      caringTone: mode === 'care',
      subtleFlirtation: mode === 'flirty',
      conciseProductive: mode === 'work',
      safeEmotional: true
    };
  }
}

export const personalityPreservation = PersonalityPreservation.getInstance();