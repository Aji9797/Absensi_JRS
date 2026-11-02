import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  MessagesSquare,
  Send,
  Search,
  Users,
  Building,
  Heart,
  Smile,
  Plus,
  ArrowLeft,
  Pin,
  Check,
  CheckCheck,
  Reply,
  Sparkles,
  Filter,
  MessageCircle,
  Home,
  Briefcase,
  AlertCircle,
  X,
  Share2,
} from 'lucide-react';
import {
  AuthUser,
  ChatConversation,
  ChatMessage,
  DiscussionCategory,
  DiscussionPost,
  DiscussionComment,
  UserAccount,
} from '../types/attendance';

interface ChatDiscussionViewProps {
  currentUser: AuthUser;
  conversations: ChatConversation[];
  onUpdateConversations: (conversations: ChatConversation[]) => void;
  messages: ChatMessage[];
  onSendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onLikeMessage?: (msgId: string) => void;
  discussions: DiscussionPost[];
  onCreateDiscussion: (newPost: Omit<DiscussionPost, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
  onLikeDiscussion: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  accounts?: UserAccount[];
  initialConversationId?: string | null;
  onClearInitialConversation?: () => void;
}

const CATEGORY_LABELS: Record<DiscussionCategory, { label: string; color: string }> = {
  PENGUMUMAN: { label: '📢 Pengumuman', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  KERJA: { label: '💼 Pekerjaan', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  WFH_WFO: { label: '🏠 WFH & Shift', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  IDE: { label: '💡 Ide & Saran', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  SANTAI: { label: '☕ Santai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const QUICK_EMOJIS = ['👍', '❤️', '🙏', '🎉', '🚀', '😊', '💡', '🔥', '👏', '✅'];

const QUICK_REPLIES = [
  'Baik, siap dikerjakan! 👍',
  'Terima kasih informasinya 🙏',
  'Saya sedang WFH hari ini 🏠',
  'Bisa meeting jam 2 siang?',
  'Laporan sudah saya perbarui ✅',
];

export const ChatDiscussionView: React.FC<ChatDiscussionViewProps> = ({
  currentUser,
  conversations,
  onUpdateConversations,
  messages,
  onSendMessage,
  onLikeMessage,
  discussions,
  onCreateDiscussion,
  onLikeDiscussion,
  onAddComment,
  onLikeComment,
  accounts = [],
  initialConversationId,
  onClearInitialConversation,
}) => {
  // Main view mode: Chat or Forum Diskusi
  const [mainView, setMainView] = useState<'CHAT' | 'DISCUSSION'>('CHAT');

  // Chat-specific state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId || (conversations.length > 0 ? conversations[0].id : null)
  );
  const [chatFilter, setChatFilter] = useState<'ALL' | 'CHANNEL' | 'DIRECT'>('ALL');
  const [chatSearch, setChatSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Discussion-specific state
  const [discussionSearch, setDiscussionSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DiscussionCategory>('KERJA');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialConversationId if passed externally (e.g. from TeamsView)
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
      setMainView('CHAT');
      if (onClearInitialConversation) {
        onClearInitialConversation();
      }
    }
  }, [initialConversationId, onClearInitialConversation]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (mainView === 'CHAT' && selectedConversationId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConversationId, mainView, isTyping]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId) {
      const conv = conversations.find((c) => c.id === selectedConversationId);
      if (conv && conv.unreadCount && conv.unreadCount > 0) {
        onUpdateConversations(
          conversations.map((c) => (c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    }
  }, [selectedConversationId]);

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesFilter =
      chatFilter === 'ALL' ||
      (chatFilter === 'CHANNEL' && (c.type === 'CHANNEL' || c.type === 'GROUP')) ||
      (chatFilter === 'DIRECT' && c.type === 'DIRECT');
    const matchesSearch =
      c.name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(chatSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const activeConversation = conversations.find((c) => c.id === selectedConversationId);
  const activeMessages = messages.filter((m) => m.conversationId === selectedConversationId);

  // Handle Send Message with realistic simulated reply
  const handleSend = (textToSend?: string) => {
    const text = (textToSend || messageInput).trim();
    if (!text || !selectedConversationId) return;

    onSendMessage({
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text,
          }
        : undefined,
    });

    setMessageInput('');
    setReplyingTo(null);
    setShowEmojiPicker(false);

    // Update conversation lastMessage
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    onUpdateConversations(
      conversations.map((c) =>
        c.id === selectedConversationId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: nowTime,
            }
          : c
      )
    );

    // Simulate auto-reply if chatting in 1-on-1 DM or official channels
    if (activeConversation && activeConversation.type === 'DIRECT') {
      const partnerName = activeConversation.name;
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        const autoReplies = [
          `Terima kasih infonya, ${currentUser.name.split(' ')[0]}! Pesan sudah saya baca.`,
          `Baik, akan segera saya koordinasikan dengan tim terkait ya. 👍`,
          `Siap, saya mengerti. Nanti saya kabari progres lanjutannya ya.`,
          `Terima kasih atas updatenya. Semangat kerja hari ini! 😊`,
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];

        onSendMessage({
          conversationId: selectedConversationId,
          senderId: activeConversation.participantIds?.find((id) => id !== currentUser.id) || 'partner',
          senderName: partnerName,
          senderRole: activeConversation.description || 'Rekan Kerja',
          senderAvatar:
            activeConversation.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          text: randomReply,
        });

        // Update last message
        const replyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        onUpdateConversations(
          conversations.map((c) =>
            c.id === selectedConversationId
              ? {
                  ...c,
                  lastMessage: randomReply,
                  lastMessageTime: replyTime,
                }
              : c
          )
        );
      }, 1600);
    }
  };

  // Start new direct chat with colleague
  const handleStartDirectChat = (user: UserAccount | AuthUser) => {
    const existingConv = conversations.find(
      (c) => c.type === 'DIRECT' && c.participantIds?.includes(user.id)
    );

    if (existingConv) {
      setSelectedConversationId(existingConv.id);
      setShowNewChatModal(false);
      return;
    }

    const newConvId = `dm-${user.id}`;
    const newConv: ChatConversation = {
      id: newConvId,
      name: user.name,
      type: 'DIRECT',
      category: 'DM',
      participantIds: [user.id, currentUser.id],
      avatar: user.avatar,
      description: user.role,
      lastMessage: 'Percakapan baru dimulai',
      lastMessageTime: 'Baru saja',
      unreadCount: 0,
      isOnline: true,
    };

    onUpdateConversations([newConv, ...conversations]);
    setSelectedConversationId(newConvId);
    setShowNewChatModal(false);
  };

  // Discussions filtered
  const filteredDiscussions = discussions.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(discussionSearch.toLowerCase()) ||
      p.content.toLowerCase().includes(discussionSearch.toLowerCase()) ||
      p.authorName.toLowerCase().includes(discussionSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onCreateDiscussion({
      title: newTitle.trim(),
      content: newContent.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatar,
      category: newCategory,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setShowNewDiscussionModal(false);
  };

  const handleSendComment = (postId: string) => {
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) return;

    onAddComment(postId, commentText);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-6 animate-fade-in">
      {/* Top Main Navigation Tabs */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setMainView('CHAT')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mainView === 'CHAT'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessagesSquare className="w-4 h-4" />
          <span>Chat & Pesan Tim</span>
          {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMainView('DISCUSSION')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mainView === 'DISCUSSION'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Forum Diskusi</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">
            {discussions.length}
          </span>
        </button>
      </div>

      {/* ==============================================================
          MODE 1: CHAT & PESAN TIM
          ============================================================== */}
      {mainView === 'CHAT' && (
        <div className="w-full flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[620px]">
          {/* If no conversation is open on mobile frame, or if viewing the full conversation list */}
          {!selectedConversationId ? (
            <div className="w-full flex flex-col p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Obrolan Karyawan</h3>
                  <p className="text-xs text-slate-500">Koordinasi cepat saluran tim & pesan pribadi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-xs"
                  title="Mulai obrolan baru"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari obrolan atau rekan..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setChatFilter('ALL')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    chatFilter === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter('CHANNEL')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    chatFilter === 'CHANNEL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Saluran & Grup
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter('DIRECT')}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    chatFilter === 'DIRECT'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Pesan Pribadi (DM)
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex flex-col divide-y divide-slate-100">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Tidak ada obrolan yang cocok dengan pencarian.
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conv.id)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors rounded-xl"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            conv.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={conv.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-100"
                        />
                        {conv.type === 'DIRECT' && (
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              conv.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        )}
                        {conv.type !== 'DIRECT' && (
                          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] border-2 border-white font-bold">
                            #
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{conv.name}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {conv.lastMessageTime || ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {conv.lastMessage || conv.description || 'Ketuk untuk membuka percakapan'}
                        </p>
                      </div>

                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Active Chat Room View */
            <div className="w-full flex-1 flex flex-col h-[650px]">
              {/* Chat Room Header */}
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConversationId(null)}
                    className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                    title="Kembali ke daftar pesan"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={
                        activeConversation?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={activeConversation?.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    {activeConversation?.type === 'DIRECT' && (
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                          activeConversation.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {activeConversation?.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">
                      {activeConversation?.type === 'DIRECT'
                        ? activeConversation.isOnline
                          ? 'Aktif Sekarang'
                          : 'Tidak Aktif'
                        : `${activeConversation?.memberCount || 10} Anggota • ${activeConversation?.description || ''}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedConversationId(null)}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-xs"
                  >
                    Daftar Chat
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {/* Conversation welcome notice */}
                <div className="text-center my-2">
                  <span className="text-[10px] text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-xs inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Pesan terenkripsi aman • Koordinasi presensi & tim
                  </span>
                </div>

                {activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const hasLiked = msg.likes?.includes(currentUser.id);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender Name for non-self messages */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-700">
                            {msg.senderName}
                          </span>
                          {msg.senderRole && (
                            <span className="text-[9px] text-slate-400">({msg.senderRole})</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-end gap-2 max-w-[85%]">
                        {!isMe && (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mb-1 border border-slate-200"
                          />
                        )}

                        <div className="flex flex-col">
                          {/* Reply Reference if present */}
                          {msg.replyTo && (
                            <div
                              className={`text-[10px] px-2.5 py-1 rounded-t-lg border-l-2 mb-0.5 truncate max-w-full ${
                                isMe
                                  ? 'bg-blue-700/30 text-blue-100 border-blue-300'
                                  : 'bg-slate-200/60 text-slate-600 border-slate-400'
                              }`}
                            >
                              <span className="font-bold">{msg.replyTo.senderName}: </span>
                              <span>{msg.replyTo.text}</span>
                            </div>
                          )}

                          {/* Main Bubble */}
                          <div
                            className={`p-3 rounded-2xl text-xs relative transition-all ${
                              isMe
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-xs'
                                : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-xs'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>

                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                isMe ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              <span>{msg.timestamp}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                            </div>

                            {/* Likes Counter Badge on bubble if any */}
                            {msg.likes && msg.likes.length > 0 && (
                              <div className="absolute -bottom-2 -left-2 bg-white text-rose-500 border border-slate-200 rounded-full px-1.5 py-0.2 text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                                ❤️ {msg.likes.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Hover/Touch Reaction Bar */}
                      <div className="flex items-center gap-1 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity px-1">
                        <button
                          type="button"
                          onClick={() => onLikeMessage && onLikeMessage(msg.id)}
                          className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors ${
                            hasLiked ? 'text-rose-500 font-bold' : 'text-slate-400'
                          }`}
                          title="Suka pesan"
                        >
                          <Heart className={`w-3 h-3 ${hasLiked ? 'fill-rose-500' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(msg)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors"
                          title="Balas pesan"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Balas</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic py-1 px-2 animate-pulse">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                    <span>{activeConversation?.name} sedang mengetik...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Suggestions */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {QUICK_REPLIES.map((replyText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(replyText)}
                    className="shrink-0 text-[10px] bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1 transition-colors"
                  >
                    {replyText}
                  </button>
                ))}
              </div>

              {/* Replying banner */}
              {replyingTo && (
                <div className="px-4 py-1.5 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs text-blue-700">
                  <div className="flex items-center gap-1.5 truncate">
                    <Reply className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-bold">Membalas {replyingTo.senderName}:</span>
                    <span className="truncate opacity-80">{replyingTo.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-500 hover:text-blue-800 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2 justify-around shadow-inner">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setMessageInput((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Control Box */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-xl transition-colors ${
                    showEmojiPicker
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Pilih emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="Ketik pesan..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!messageInput.trim()}
                  className={`p-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center ${
                    messageInput.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                  title="Kirim pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          MODE 2: FORUM DISKUSI
          ============================================================== */}
      {mainView === 'DISCUSSION' && (
        <div className="w-full flex flex-col gap-4">
          {/* Header Action Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Ruang Diskusi & Berita</h3>
                <p className="text-xs text-slate-500">
                  Wadah ide, pengumuman HR, koordinasi WFH, dan interaksi karyawan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDiscussionModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Topik</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari topik diskusi, ide, atau pengumuman..."
                value={discussionSearch}
                onChange={(e) => setDiscussionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Kategori
              </button>
              {(Object.keys(CATEGORY_LABELS) as DiscussionCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {CATEGORY_LABELS[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Discussion Posts Feed */}
          <div className="flex flex-col gap-3.5">
            {filteredDiscussions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 text-center text-slate-400 text-xs">
                Belum ada topik diskusi untuk kategori ini. Jadilah yang pertama memulai!
              </div>
            ) : (
              filteredDiscussions.map((post) => {
                const hasLiked = post.likes.includes(currentUser.id);
                const isCommentsOpen = !!expandedComments[post.id];
                const catMeta = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.KERJA;

                return (
                  <div
                    key={post.id}
                    className={`bg-white rounded-3xl p-4 md:p-5 border shadow-sm transition-all flex flex-col gap-3 ${
                      post.isPinned
                        ? 'border-indigo-200 ring-2 ring-indigo-100/70 bg-gradient-to-b from-indigo-50/20 to-white'
                        : 'border-slate-200/90'
                    }`}
                  >
                    {/* Pinned banner if official HR */}
                    {post.isPinned && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit border border-indigo-200">
                        <Pin className="w-3 h-3 text-indigo-600" />
                        <span>PENGUMUMAN RESMI PERUSAHAAN (PINNED)</span>
                      </div>
                    )}

                    {/* Author & Category Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{post.authorName}</h4>
                          <p className="text-[10px] text-slate-500">
                            {post.authorRole} • {post.createdAt}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.color}`}
                      >
                        {catMeta.label}
                      </span>
                    </div>

                    {/* Title & Content */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags if any */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interactive Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        {/* Like Post Button */}
                        <button
                          type="button"
                          onClick={() => onLikeDiscussion(post.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl transition-all ${
                            hasLiked
                              ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                          />
                          <span>{post.likes.length} Suka</span>
                        </button>

                        {/* Expand Comments Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          className="flex items-center gap-1 text-xs text-slate-500 hover:bg-slate-100 px-2.5 py-1 rounded-xl transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.comments.length} Komentar</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400">JRS Community</span>
                    </div>

                    {/* Expandable Comments Section */}
                    {isCommentsOpen && (
                      <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-2.5 animate-fade-in">
                        {/* Comments List */}
                        {post.comments.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic text-center py-2">
                            Belum ada komentar. Berikan tanggapan pertama Anda!
                          </p>
                        ) : (
                          post.comments.map((comm) => {
                            const hasLikedComm = comm.likes.includes(currentUser.id);

                            return (
                              <div
                                key={comm.id}
                                className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs"
                              >
                                <img
                                  src={comm.authorAvatar}
                                  alt={comm.authorName}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="font-bold text-slate-800 text-[11px]">
                                      {comm.authorName}
                                    </h5>
                                    <span className="text-[9px] text-slate-400">
                                      {comm.createdAt}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                    {comm.content}
                                  </p>

                                  <div className="flex items-center gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onLikeComment && onLikeComment(post.id, comm.id)
                                      }
                                      className={`text-[9px] flex items-center gap-0.5 ${
                                        hasLikedComm
                                          ? 'text-rose-500 font-bold'
                                          : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <Heart
                                        className={`w-2.5 h-2.5 ${hasLikedComm ? 'fill-rose-500' : ''}`}
                                      />
                                      <span>{comm.likes.length} Suka</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Add Comment Input */}
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <input
                            type="text"
                            placeholder="Tulis komentar atau tanggapan..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendComment(post.id);
                              }
                            }}
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendComment(post.id)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            Kirim
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: MULAI CHAT BARU
          ============================================================== */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Mulai Obrolan Baru</h3>
                <p className="text-xs text-slate-500">Pilih rekan kerja untuk mengirim pesan langsung</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {accounts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Tidak ada kontak terdaftar.
                </div>
              ) : (
                accounts
                  .filter((acc) => acc.id !== currentUser.id)
                  .map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleStartDirectChat(acc)}
                      className="flex items-center gap-3 p-2.5 hover:bg-slate-50 text-left transition-colors rounded-xl"
                    >
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{acc.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{acc.role}</p>
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg">
                        Chat
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: BUAT TOPIK DISKUSI BARU
          ============================================================== */}
      {showNewDiscussionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePost}
            className="bg-white rounded-3xl max-w-md w-full p-5 border border-slate-200 shadow-2xl flex flex-col gap-4 animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Buat Topik Diskusi Baru</h3>
                <p className="text-xs text-slate-500">
                  Bagikan ide, informasi kerja, atau saran untuk tim
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDiscussionModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Judul Topik
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ide Otomatisasi Laporan Mingguan..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Kategori Diskusi
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DiscussionCategory)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="KERJA">💼 Pekerjaan & Target</option>
                  <option value="WFH_WFO">🏠 WFH & Shift Coordination</option>
                  <option value="IDE">💡 Ide & Usulan Fasilitas</option>
                  <option value="SANTAI">☕ Santai & Olahraga</option>
                  {currentUser.userRole === 'ADMIN' && (
                    <option value="PENGUMUMAN">📢 Pengumuman Resmi HR</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Isi Diskusi / Rincian
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Jelaskan detail topik yang ingin Anda diskusikan bersama rekan..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Tag Kata Kunci (opsional, pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Productivity, Tool, Q4"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewDiscussionModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs shadow-blue-500/20"
              >
                Terbitkan Topik
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
