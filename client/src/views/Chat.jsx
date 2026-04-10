import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, Smile, Plus, MoreHorizontal, 
  ArrowLeft, Phone, Video, Info, Loader2,
  Trash2, Copy, Reply, Film, Music, List as ListIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatApi, socialApi } from '../api';
import { socket } from '../App';
import GifPicker from '../components/GifPicker';
import MediaPickerModal from '../components/MediaPickerModal';
import LoadingDots from '../components/LoadingDots';
import { useTranslation } from 'react-i18next';

const Chat = () => {
  const { t } = useTranslation();
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGifs, setShowGifs] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Deterministic room ID: chat_minId_maxId
  const roomId = user && friendId 
    ? `chat_${Math.min(user.id, parseInt(friendId))}_${Math.max(user.id, parseInt(friendId))}`
    : null;

  useEffect(() => {
    if (friendId) fetchFriendData();
    if (roomId) {
      loadMessages();
      socket.emit('join_room', roomId);
      
      socket.on('new_msg', (data) => {
        if (data.roomId === roomId) {
          setMessages(prev => [...prev, {
            ...data,
            id: data.id || Date.now(),
            user: { id: data.userId, avatar: data.avatar, name: data.userName },
            created_at: data.created_at || new Date().toISOString()
          }]);
        }
      });

      socket.on('typing_status', (data) => {
        if (data.roomId === roomId && data.userId !== user?.id) {
          setFriendTyping(data.isTyping);
        }
      });
    }

    return () => {
      if (roomId) {
        socket.emit('leave_room', roomId);
        socket.off('new_msg');
        socket.off('typing_status');
      }
    };
  }, [friendId, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, friendTyping]);

  const fetchFriendData = async () => {
    try {
      const res = await socialApi.getUserProfile(friendId);
      setFriend(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await chatApi.getMessages(roomId);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !roomId) return;

    const msgData = {
      roomId,
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      content: input,
      type: 'text',
      created_at: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, {
      ...msgData,
      id: `temp-${Date.now()}`,
      user: { id: user.id, avatar: user.avatar, name: user.name }
    }]);

    socket.emit('send_msg', msgData);
    setInput('');
    handleTyping(false);
  };

  const handleGifSelect = (gifUrl) => {
    if (!roomId) return;

    const msgData = {
      roomId,
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      content: '',
      gif_url: gifUrl,
      type: 'gif',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, {
      ...msgData,
      id: `temp-${Date.now()}`,
      user: { id: user.id, avatar: user.avatar, name: user.name }
    }]);

    socket.emit('send_msg', msgData);
    setShowGifs(false);
  };

  const handleMediaSelect = (item) => {
    // item: { id, type, title, image, subtitle }
    if (!roomId) return;

    const msgData = {
      roomId,
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      content: '', // No text if it's just media
      itemId: item.id.toString(),
      itemType: item.type,
      itemTitle: item.title,
      itemImage: item.image,
      itemSubtitle: item.subtitle,
      type: item.type, // 'movie', 'song', 'list'
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, {
      ...msgData,
      id: `temp-${Date.now()}`,
      user: { id: user.id, avatar: user.avatar, name: user.name }
    }]);

    socket.emit('send_msg', msgData);
    setShowMediaPicker(false);
  };

  const handleTyping = (typing) => {
    if (typing === isTyping) return;
    setIsTyping(typing);
    socket.emit('typing', { roomId, userId: user.id, userName: user.name, isTyping: typing });
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    handleTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const renderMediaCard = (msg) => {
    const isMe = msg.user_id === user?.id || msg.user?.id === user?.id;
    const navigateTo = msg.type === 'list' 
      ? `/list/${msg.item_id || msg.itemId}` 
      : (msg.type === 'movie' ? `/movie/${msg.item_id || msg.itemId}` : `/song/${msg.item_id || msg.itemId}`);

    const Icon = msg.type === 'list' ? ListIcon : (msg.type === 'movie' ? Film : Music);

    return (
      <div className="chat-media-card" onClick={() => navigate(navigateTo)}>
        <div className="media-card-img">
          <img src={msg.item_image || msg.itemImage} alt="" />
          <div className="media-card-icon-overlay">
            <Icon size={16} />
          </div>
        </div>
        <div className="media-card-info">
          <span className="media-card-title">{msg.item_title || msg.itemTitle}</span>
          <span className="media-card-subtitle">{msg.item_subtitle || msg.itemSubtitle}</span>
        </div>
      </div>
    );
  };

  if (loading && !friend) {
    return (
      <div className="chat-loading view-container">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="chat-view view-container animate-fadeIn">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <button className="chat-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <div className="chat-user-info" onClick={() => navigate(`/user/${friendId}`)}>
              <div className="chat-avatar-wrapper">
                <img src={friend?.avatar || `https://ui-avatars.com/api/?name=${friend?.name}`} alt="" />
                <span className="online-status"></span>
              </div>
              <div className="chat-user-metadata">
                <span className="chat-user-name">{friend?.name}</span>
                <span className="chat-user-status">En línea</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="chat-messages">
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id || msg.user?.id === user?.id;
            const isMedia = ['movie', 'song', 'list'].includes(msg.type);

            return (
              <div key={msg.id} className={`message-wrapper ${isMe ? 'own' : 'other'} ${isMedia ? 'media-msg' : ''}`}>
                {!isMe && (
                  <img src={msg.user?.avatar || `https://ui-avatars.com/api/?name=${msg.user?.name}`} className="message-avatar" alt="" />
                )}
                <div className="message-bubble">
                  {msg.type === 'gif' ? (
                    <img src={msg.gif_url} className="message-gif" alt="GIF" />
                  ) : isMedia ? (
                    renderMediaCard(msg)
                  ) : (
                    <p className="message-content">{msg.content}</p>
                  )}
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          {friendTyping && (
             <div className="message-wrapper other">
                <img src={friend?.avatar || `https://ui-avatars.com/api/?name=${friend?.name}`} className="message-avatar" alt="" />
                <div className="message-bubble typing-bubble">
                  <LoadingDots className="compact" />
                </div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Tools (Emoji, GIF, Media) */}
        {showGifs && (
          <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifs(false)} />
        )}
        {showMediaPicker && (
          <MediaPickerModal onSelect={handleMediaSelect} onClose={() => setShowMediaPicker(false)} />
        )}

        {/* Chat Input Area */}
        <div className="chat-input-area">
          <button className="chat-tool-btn" onClick={() => setShowMediaPicker(true)}>
            <Plus size={20} />
          </button>
          <button className="chat-tool-btn" onClick={() => setShowGifs(!showGifs)}>
            <Smile size={20} />
          </button>
          
          <form className="chat-form" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Escribe un mensaje..." 
              value={input}
              onChange={onInputChange}
              onFocus={() => handleTyping(false)}
            />
            <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
