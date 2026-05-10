import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App from "../App";
import { storage } from "@/services/storage";

const mockSentences = [
  {
    id: "1",
    english: "The early bird catches the worm.",
    chinese: "早起的鸟儿有虫吃。",
    blanks: [{ word: "catches", hint: "抓住" }],
    level: "junior",
  },
  {
    id: "2",
    english: "Actions speak louder than words.",
    chinese: "行动胜于言辞。",
    blanks: [
      { word: "Actions", hint: "行动" },
      { word: "words", hint: "言辞" },
    ],
    level: "junior",
  },
];

vi.mock("@/data/loader", () => ({
  loadDictionary: vi.fn(() => Promise.resolve(mockSentences)),
}));

vi.mock("@/data/dictionaries", () => ({
  getDictionaryById: vi.fn(() => ({ id: "test", name: "Test Dictionary" })),
  dictionaries: [
    {
      id: "test",
      name: "Test Dictionary",
      file: "test.json",
      description: "Test",
    },
  ],
}));

describe("App keyboard shortcuts", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    localStorage.clear();
    vi.spyOn(storage, "hasActiveSession").mockReturnValue(false);
    vi.spyOn(storage, "loadSession").mockReturnValue(null);
    vi.spyOn(storage, "hasOnboardingComplete").mockReturnValue(true);
    vi.spyOn(storage, "setOnboardingComplete").mockImplementation(() => {});
    vi.spyOn(storage, "saveSession").mockImplementation(() => {});
    vi.spyOn(storage, "clearSession").mockImplementation(() => {});
    vi.spyOn(storage, "getMistakeCount").mockReturnValue(0);
    vi.spyOn(storage, "getHistoryCount").mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("should advance to next sentence on Enter when answer is correct", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("早起的鸟儿有虫吃。")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "catches" } });
    fireEvent.click(screen.getByText("提交答案"));

    await waitFor(() => {
      expect(screen.getByText("回答正确！")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("行动胜于言辞。")).toBeInTheDocument();
    });
  });

  it("should advance to next sentence on Space when answer is correct", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("早起的鸟儿有虫吃。")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "catches" } });
    fireEvent.click(screen.getByText("提交答案"));

    await waitFor(() => {
      expect(screen.getByText("回答正确！")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: " ", code: "Space" });

    await waitFor(() => {
      expect(screen.getByText("行动胜于言辞。")).toBeInTheDocument();
    });
  });

  it("should not advance on Enter when answer is not shown", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("早起的鸟儿有虫吃。")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Enter", code: "Enter" });

    expect(screen.getByText("早起的鸟儿有虫吃。")).toBeInTheDocument();
  });

  it("should not advance on Enter when answer is wrong", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("早起的鸟儿有虫吃。")).toBeInTheDocument();
    });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("提交答案"));

    await waitFor(() => {
      expect(screen.getByText("你的答案")).toBeInTheDocument();
      expect(screen.getByText("正确答案")).toBeInTheDocument();
      expect(screen.getByText("解析")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Enter", code: "Enter" });

    // Chinese appears twice after wrong answer: main content + analysis section
    expect(screen.getAllByText("早起的鸟儿有虫吃。").length).toBe(2);
  });
});