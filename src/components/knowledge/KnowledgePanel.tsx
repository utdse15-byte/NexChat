/**
 * 知识库管理面板
 * 文档上传 + 文档列表 + 删除操作
 */
import { useState, useEffect, useCallback } from 'react';
import { Drawer, Button, Upload, message, Tag, Popconfirm, Empty, Spin } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileMarkdownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useConfigStore } from '../../domain/config/configStore';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: string;
  created_at: number;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  txt: <FileTextOutlined className="text-blue-400" />,
  md: <FileMarkdownOutlined className="text-emerald-400" />,
  markdown: <FileMarkdownOutlined className="text-emerald-400" />,
  pdf: <FilePdfOutlined className="text-red-400" />,
};

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  ready: { color: 'green', label: '就绪' },
  processing: { color: 'blue', label: '处理中' },
  error: { color: 'red', label: '失败' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function KnowledgePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const backendUrl = useConfigStore((s) => s.backendUrl);
  const backendToken = useConfigStore((s) => s.backendToken);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (backendToken) headers['Authorization'] = `Bearer ${backendToken}`;
      const res = await fetch(`${backendUrl}/knowledge/documents`, { headers });
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch {
      // 后端未启动时静默失败
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (open) fetchDocuments();
  }, [open, fetchDocuments]);

  const handleDelete = async (docId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (backendToken) headers['Authorization'] = `Bearer ${backendToken}`;
      const res = await fetch(`${backendUrl}/knowledge/documents/${docId}`, { method: 'DELETE', headers });
      if (res.ok) {
        message.success('文档已删除');
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        message.error('删除失败');
      }
    } catch {
      message.error('网络错误');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: `${backendUrl}/knowledge/upload`,
    headers: backendToken ? { Authorization: `Bearer ${backendToken}` } : undefined,
    accept: '.txt,.md,.markdown,.pdf',
    showUploadList: false,
    beforeUpload: () => {
      setUploading(true);
      return true;
    },
    onChange(info) {
      if (info.file.status === 'done') {
        setUploading(false);
        message.success(`${info.file.name} 上传成功`);
        fetchDocuments();
      } else if (info.file.status === 'error') {
        setUploading(false);
        message.error(`${info.file.name} 上传失败`);
      }
    },
  };

  return (
    <Drawer
      title={<span className="text-slate-100 font-medium">📚 知识库管理</span>}
      placement="right"
      onClose={onClose}
      open={open}
      width={380}
      className="dark-drawer"
      classNames={{
        header: '!bg-slate-900 border-b border-white/10 pb-3',
        body: '!bg-slate-900 !text-slate-300 py-4 custom-scrollbar',
        mask: 'backdrop-blur-sm bg-black/50',
      }}
      closeIcon={<span className="text-slate-400 hover:text-slate-200 text-lg sm:text-2xl font-light cursor-pointer leading-none">×</span>}
    >
      <div className="space-y-6">
        {/* 上传区域 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">上传文档</h3>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchDocuments}
              className="text-slate-400 hover:text-cyan-400"
            />
          </div>
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              block
              className="bg-slate-800/50 border-white/10 text-slate-200 hover:border-cyan-400/50 hover:text-cyan-400 h-10"
            >
              选择文件（TXT / MD / PDF）
            </Button>
          </Upload>
          <p className="text-xs text-slate-500 mt-2">
            上传文档后，聊天时 AI 将自动检索相关内容辅助回答。
          </p>
        </section>

        <div className="h-px bg-white/5 w-full" />

        {/* 文档列表 */}
        <section>
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
            已上传文档 ({documents.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="small" />
            </div>
          ) : documents.length === 0 ? (
            <Empty
              description={<span className="text-slate-500 text-sm">暂无文档</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const statusInfo = STATUS_MAP[doc.status] || STATUS_MAP.error;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="text-lg shrink-0">
                      {FILE_ICONS[doc.file_type] || <FileTextOutlined className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200 truncate" title={doc.filename}>
                        {doc.filename}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs text-slate-500">{doc.chunk_count} 块</span>
                        <Tag color={statusInfo.color} className="text-[10px] px-1 py-0 leading-4 border-0">
                          {statusInfo.label}
                        </Tag>
                      </div>
                    </div>
                    <Popconfirm
                      title="确定删除此文档？"
                      description="将同时删除向量索引"
                      onConfirm={() => handleDelete(doc.id)}
                      okText="删除"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="text-slate-500 hover:text-red-400 shrink-0"
                      />
                    </Popconfirm>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Drawer>
  );
}
