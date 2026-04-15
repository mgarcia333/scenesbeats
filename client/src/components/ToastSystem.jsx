import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, UserPlus, Music, Film, CheckCircle, Info } from 'lucide-react';

/**
 * Global Toast System
 * Usage: window.dispatchEvent(new CustomEvent('toast', { detail: { message, type, title } }))
 */
const ToastSystem = () => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((toast) => {
        const id = Date.now();
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);

        // Auto-remove after 5 seconds
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    useEffect(() => {
        const handleToastEvent = (e) => {
            addToast(e.detail);
        };

        window.addEventListener('toast', handleToastEvent);
        return () => window.removeEventListener('toast', handleToastEvent);
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const { message, title, type = 'info', actionLabel, onAction } = toast;

    const getIcon = () => {
        switch (type) {
            case 'friend_request': return <UserPlus className="text-blue-400" size={20} />;
            case 'friend_accepted': return <CheckCircle className="text-green-400" size={20} />;
            case 'new_activity': return <Bell className="text-purple-400" size={20} />;
            case 'favorite': return <Film className="text-pink-400" size={20} />;
            default: return <Info className="text-blue-400" size={20} />;
        }
    };

    return (
        <div className={`toast-item animate-toastIn ${type}`}>
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                {title && <div className="toast-title">{title}</div>}
                <div className="toast-message">{message}</div>
                {actionLabel && (
                    <button className="toast-action" onClick={onAction}>
                        {actionLabel}
                    </button>
                )}
            </div>
            <button className="toast-close" onClick={onRemove}>
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastSystem;
