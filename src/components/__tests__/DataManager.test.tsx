import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataManager } from '../DataManager';
import { storage } from '@/services/storage';

describe('DataManager', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders data overview with correct counts', () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(5);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(3);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    render(<DataManager onBack={mockOnBack} />);

    expect(screen.getByText('数据管理')).toBeInTheDocument();
    expect(screen.getByText('5 次')).toBeInTheDocument();
    expect(screen.getByText('3 题')).toBeInTheDocument();
    expect(screen.getByText('无')).toBeInTheDocument();
  });

  it('shows active session badge when session exists', () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(true);

    render(<DataManager onBack={mockOnBack} />);

    expect(screen.getByText('有')).toBeInTheDocument();
    expect(screen.getByText('可恢复')).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    render(<DataManager onBack={mockOnBack} />);

    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('triggers file download on export', () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    const exportDataSpy = vi.spyOn(storage, 'exportAllData').mockReturnValue({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { session: null, mistakes: [], history: [] },
    });

    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Mock anchor click
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<DataManager onBack={mockOnBack} />);

    const exportButton = screen.getByText('导出数据');
    fireEvent.click(exportButton);

    expect(exportDataSpy).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');

    exportDataSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('opens file input when import button clicked', () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    render(<DataManager onBack={mockOnBack} />);

    const fileInput = screen.getByTestId('file-input');
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    const importButton = screen.getByText('导入数据');
    fireEvent.click(importButton);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('shows success message after successful import', async () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    vi.spyOn(storage, 'importAllData').mockReturnValue({
      success: true,
      message: '导入成功：共导入 1 条历史记录。',
      importedCounts: { session: 0, mistakes: 0, history: 1, xpProfile: 0, dailyChallenges: 0, badgeProgress: 0, badges: 0, personalWords: 0 },
    });

    render(<DataManager onBack={mockOnBack} />);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;

    const file = new File([JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { session: null, mistakes: [], history: [] },
    })], 'backup.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for file reader to process and dialog to appear
    await waitFor(() => {
      expect(screen.getByText('确认导入数据')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('确认导入');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('导入成功：共导入 1 条历史记录。')).toBeInTheDocument();
    });
  });

  it('shows error message after failed import', async () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    vi.spyOn(storage, 'importAllData').mockReturnValue({
      success: false,
      message: '导入失败：数据格式无效。',
      importedCounts: { session: 0, mistakes: 0, history: 0, xpProfile: 0, dailyChallenges: 0, badgeProgress: 0, badges: 0, personalWords: 0 },
    });

    render(<DataManager onBack={mockOnBack} />);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;

    const file = new File([JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { session: null, mistakes: [], history: [] },
    })], 'backup.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('确认导入数据')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('确认导入');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('导入失败：数据格式无效。')).toBeInTheDocument();
    });
  });

  it('shows error for invalid JSON file', async () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    render(<DataManager onBack={mockOnBack} />);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const file = new File(['not valid json'], 'backup.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/导入失败：文件不是有效的 JSON 格式/)).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog before import', async () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    render(<DataManager onBack={mockOnBack} />);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const file = new File([JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { session: null, mistakes: [], history: [] },
    })], 'backup.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('确认导入数据')).toBeInTheDocument();
      expect(screen.getByText(/导入数据将覆盖现有的学习记录/)).toBeInTheDocument();
    });
  });

  it('cancels import when cancel button clicked', async () => {
    vi.spyOn(storage, 'getHistoryCount').mockReturnValue(0);
    vi.spyOn(storage, 'getMistakeCount').mockReturnValue(0);
    vi.spyOn(storage, 'hasActiveSession').mockReturnValue(false);

    const importSpy = vi.spyOn(storage, 'importAllData');

    render(<DataManager onBack={mockOnBack} />);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const file = new File([JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { session: null, mistakes: [], history: [] },
    })], 'backup.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('确认导入数据')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(importSpy).not.toHaveBeenCalled();
    expect(screen.queryByText('确认导入数据')).not.toBeInTheDocument();
  });
});
