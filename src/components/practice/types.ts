/**
 * Strategy Pattern Types for PracticeCard Mode Implementations
 *
 * This module defines the interfaces for different practice mode strategies,
 * allowing decoupled rendering logic for each practice mode.
 */

import type { ReactNode, KeyboardEvent, RefCallback } from 'react';
import type { Sentence, SentenceToken, ChoiceOption, HintLevel } from '@/data/types';

// ============================================================================
// Base Strategy Interface
// ============================================================================

/**
 * Core props shared across all practice mode strategies.
 * All mode-specific strategies must support these base props.
 */
export interface PracticeCardBaseProps {
  /** The sentence being practiced */
  sentence: Sentence;
  /** User input values (for fill-in-blanks/dictation modes) */
  inputs: string[];
  /** Whether to show the result feedback */
  showResult: boolean;
  /** Whether the answer is correct */
  isCorrect: boolean;
  /** Number of attempts made */
  attempts: number;
  /** Whether audio is currently playing */
  isSpeaking: boolean;
  /** Current question number (optional, for progress display) */
  currentQuestion?: number;
  /** Total number of questions (optional, for progress display) */
  totalQuestions?: number;
  /** Whether focus mode is enabled (larger UI) */
  isFocusMode?: boolean;
  /** Audio playback speed */
  playbackRate?: number;
  /** Callback when playback speed changes */
  onSpeedChange?: (_rate: number) => void;
  /** Callback when input value changes */
  onInputChange: (_index: number, _value: string) => void;
  /** Callback when answer is checked/submitted */
  onCheck: (_param?: string | string[]) => void;
  /** Callback to proceed to next question */
  onNext: () => void;
  /** Callback to retry the current question */
  onRetry: () => void;
  /** Callback to play audio */
  onSpeak: () => void;
  /** Current hint level for controlling hint display */
  hintLevel?: HintLevel;
  /** Function to check if hint should be shown (based on probability) */
  shouldShowHint?: () => boolean;
}

/**
 * Ref callback type for input elements (used for auto-focus)
 */
export type InputRefCallback = RefCallback<HTMLInputElement | null>;

/**
 * Handler callback types for consistent signatures
 */
export type InputChangeHandler = (_index: number, _value: string) => void;
export type CheckHandler = (_param?: string | string[]) => void;
export type SpeedChangeHandler = (_rate: number) => void;
export type KeyDownHandler = (_e: KeyboardEvent<HTMLInputElement>) => void;

// ============================================================================
// Fill-in-Blanks Mode Strategy
// ============================================================================

/**
 * Props specific to fill-in-blanks mode.
 * In this mode, words in the sentence are replaced with input fields.
 */
export interface FillInBlanksModeProps {
  /** Array of ref callbacks for each input element (for auto-focus) */
  inputRefs?: InputRefCallback[];
}

/**
 * Combined props for fill-in-blanks mode rendering.
 * Extends base props with mode-specific configuration.
 */
export interface FillInBlanksModeConfig extends PracticeCardBaseProps, FillInBlanksModeProps {}

// ============================================================================
// Dictation Mode Strategy
// ============================================================================

/**
 * Props specific to dictation mode.
 * In this mode, users listen to audio and type the words they hear.
 */
export interface DictationModeProps {
  /** Whether to show the hint area (first letter of each word) */
  showHints?: boolean;
}

/**
 * Combined props for dictation mode rendering.
 */
export interface DictationModeConfig extends PracticeCardBaseProps, DictationModeProps {}

// ============================================================================
// Multiple-Choice Mode Strategy
// ============================================================================

/**
 * Props specific to multiple-choice mode.
 * In this mode, users select the correct sentence from options.
 */
export interface MultipleChoiceModeProps {
  /** Available choice options */
  options: ChoiceOption[];
  /** ID of the currently selected choice */
  selectedChoiceId: string | null;
  /** Callback when a choice is selected */
  onSelectChoice: (_choiceId: string) => void;
}

/**
 * Combined props for multiple-choice mode rendering.
 */
export interface MultipleChoiceModeConfig extends PracticeCardBaseProps, MultipleChoiceModeProps {}

// ============================================================================
// Sentence-Reorder Mode Strategy
// ============================================================================

/**
 * Props specific to sentence-reorder mode.
 * In this mode, users arrange scrambled tokens into the correct sentence.
 */
export interface SentenceReorderModeProps {
  /** Available sentence tokens to arrange */
  sentenceTokens: SentenceToken[];
  /** Currently ordered token IDs (user's arrangement) */
  orderedTokenIds: string[];
  /** Callback when a token is selected from the pool */
  onSelectToken: (_tokenId: string) => void;
  /** Callback when a token is deselected (removed from arrangement) */
  onDeselectToken: (_index: number) => void;
  /** Callback when user skips this definition sentence */
  onSkip?: () => void;
}

/**
 * Combined props for sentence-reorder mode rendering.
 */
export interface SentenceReorderModeConfig extends PracticeCardBaseProps, SentenceReorderModeProps {}

// ============================================================================
// Main Strategy Interface
// ============================================================================

/**
 * Main strategy interface for PracticeCard mode rendering.
 *
 * Each strategy implementation handles the rendering logic for a specific
 * practice mode (fill-in-blanks, dictation, multiple-choice, sentence-reorder).
 *
 * @example
 * ```tsx
 * const fillInBlanksStrategy: PracticeCardModeStrategy = {
 *   mode: 'fill-in-blanks',
 *   canSubmit: (props) => props.inputs.some(i => i.trim()),
 *   render: (props) => <FillInBlanksMode {...props} />,
 * };
 * ```
 */
export interface PracticeCardModeStrategy {
  /** The mode this strategy handles */
  mode: PracticeMode;
  /**
   * Determines if the current state allows submission.
   * Used to enable/disable the submit button.
   */
  canSubmit?: (_props: PracticeCardBaseProps & Record<string, unknown>) => boolean;
  /**
   * Renders the mode-specific content area.
   * This replaces the input/input area in the PracticeCard.
   */
  render: (_props: PracticeCardBaseProps & Record<string, unknown>) => ReactNode;
  /**
   * Optional: Render mode-specific hints (shown below the content).
   * Return null to use default hints rendering.
   */
  renderHints?: (_props: PracticeCardBaseProps & Record<string, unknown>) => ReactNode | null;
  /**
   * Optional: Render mode-specific feedback content.
   * Return null to use default feedback rendering.
   */
  renderFeedback?: (_props: PracticeCardBaseProps & Record<string, unknown>) => ReactNode | null;
  /**
   * Optional: Get the user's answer as a displayable string.
   * Used for showing "your answer" in feedback.
   */
  getUserAnswer?: (_props: PracticeCardBaseProps & Record<string, unknown>) => string;
  /**
   * Optional: Get the correct answer as a displayable string.
   * Used for showing "correct answer" in feedback.
   */
  getCorrectAnswer?: (_props: PracticeCardBaseProps & Record<string, unknown>) => string;
  /**
   * Optional: Check if the strategy supports Enter key submission.
   * Return false to disable Enter key handling.
   */
  supportsEnterSubmit?: () => boolean;
}

// ============================================================================
// PracticeMode Type Re-export
// ============================================================================

/**
 * Supported practice modes.
 * Each mode has distinct rendering and interaction patterns.
 */
export type PracticeMode = 'fill-in-blanks' | 'dictation' | 'multiple-choice' | 'sentence-reorder';

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Props passed to a strategy's render function.
 * Each mode implementation can assert the full type of these props.
 */
export type StrategyRenderProps<T extends PracticeMode> =
  T extends 'fill-in-blanks' ? FillInBlanksModeConfig :
  T extends 'dictation' ? DictationModeConfig :
  T extends 'multiple-choice' ? MultipleChoiceModeConfig :
  T extends 'sentence-reorder' ? SentenceReorderModeConfig :
  PracticeCardBaseProps;

/**
 * Helper type to extract mode-specific handler types.
 */
export type ModeHandlers<T extends PracticeMode> = {
  'fill-in-blanks': { inputChange: InputChangeHandler };
  'dictation': { inputChange: InputChangeHandler };
  'multiple-choice': { selectChoice: (_choiceId: string) => void };
  'sentence-reorder': { selectToken: (_tokenId: string) => void; deselectToken: (_index: number) => void };
}[T];

/**
 * Strategy context type for managing strategy state.
 * Used by the PracticeCard to switch between modes.
 */
export interface PracticeCardStrategyContext {
  /** Current active strategy */
  strategy: PracticeCardModeStrategy;
  /** All available strategies */
  strategies: PracticeCardModeStrategy[];
  /** Switch to a different strategy */
  setStrategy: (_mode: PracticeMode) => void;
}
