import React, { useState } from 'react';
import { Star, Phone, Mail, MessageSquare, Sparkles, Edit2, User } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';

const ContactCard = ({ contact, onOpenDetail, onEdit }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const contactId = contact._id || contact.id;
  const isFav = isFavorite(contactId);
  const [imageError, setImageError] = useState(false);

  const handleStarClick = (e) => {
    e.stopPropagation();
    toggleFavorite(contactId);
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  // Generate Teams chat link
  const teamsLink = contact.email
    ? `https://teams.microsoft.com/l/chat/0/0?users=${contact.email}`
    : null;

  return (
    <div
      onClick={() => onOpenDetail(contact)}
      className="contact-card group relative bg-gradient-to-br from-white to-purple-50/30 dark:bg-[linear-gradient(180deg,rgba(26,31,38,0.98),rgba(16,20,26,0.98))] rounded-2xl border-2 border-purple-200/60 dark:border-[#24465c] hover:border-purple-400 dark:hover:border-[#3cc9ff] hover:shadow-xl hover:shadow-purple-200/50 dark:shadow-[0_10px_25px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_14px_30px_rgba(0,0,0,0.45)] transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1 active:scale-[0.985]"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-fuchsia-500/5 dark:from-[#23b7f2]/8 dark:via-transparent dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/50 to-transparent dark:from-white/4 dark:to-transparent pointer-events-none" />

      {/* Sparkle effect on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12">
        <Sparkles className="w-4 h-4 text-purple-400 dark:text-[#23b7f2] animate-pulse" />
      </div>

      {/* Header with Star, Edit and ERT Badge */}
      <div className="relative flex items-start justify-between px-5 py-4 border-b border-purple-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStarClick}
            className="p-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`w-5 h-5 transition-all duration-200 ${
                isFav
                  ? 'fill-amber-400 text-amber-400 drop-shadow-glow'
                  : 'text-purple-300 dark:text-[#4dcfff] hover:text-purple-500 dark:hover:text-[#8ce4ff]'
              }`}
            />
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contact);
              }}
              className="p-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Edit contact"
              title="Edit contact"
            >
              <Edit2 className="w-4 h-4 text-purple-600 dark:text-[#4dcfff] hover:text-purple-700 dark:hover:text-[#8ce4ff]" />
            </button>
          )}
        </div>
        {contact.is_ert && (
          <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-md animate-pulse-soft">
            🚨 ERT
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="relative px-5 py-4">
        {/* Profile Picture and Name */}
        <div className="flex items-start gap-3 mb-3">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {contact.profile_picture && !imageError ? (
              <img
                src={contact.profile_picture}
                alt={contact.name}
                onError={() => setImageError(true)}
                className="w-14 h-14 rounded-full object-cover border-[3px] border-purple-200 dark:border-[#2d6584] shadow-md dark:shadow-[0_12px_24px_rgba(2,6,23,0.4)] group-hover:border-purple-400 dark:group-hover:border-[#53d1ff] transition-all"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 dark:from-[#163243] dark:to-[#1a2230] flex items-center justify-center border-[3px] border-purple-200 dark:border-[#2d6584] shadow-md dark:shadow-[0_12px_24px_rgba(2,6,23,0.4)] group-hover:border-purple-400 dark:group-hover:border-[#53d1ff] transition-all">
                <User className="w-7 h-7 text-purple-400 dark:text-[#7eddff]" />
              </div>
            )}
          </div>

          {/* Name and Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2 group-hover:text-purple-700 dark:group-hover:text-white transition-colors">
              {contact.name}
            </h3>

            {contact.designation && (
              <p className="text-sm text-purple-600 dark:text-[#e8eef5] font-semibold mb-1 line-clamp-1">
                {contact.designation}
              </p>
            )}

            {contact.department && (
              <p className="text-xs text-gray-500 dark:text-slate-300/80 line-clamp-1">
                📍 {contact.department}
              </p>
            )}
          </div>
        </div>

        {contact.extension && (
          <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-[#102431] dark:to-[#0e1d27] border border-purple-200 dark:border-[#29556e] rounded-full text-xs font-bold text-purple-700 dark:text-[#7eddff] shadow-sm">
            📞 Ext: {contact.extension}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="relative flex gap-2 px-4 py-3 border-t border-purple-100 dark:border-[#24303c] bg-purple-50/50 dark:bg-[linear-gradient(180deg,rgba(19,24,31,0.98),rgba(16,20,26,0.98))] transition-all duration-300">
        {contact.mobile && (
          <a
            href={`tel:${contact.mobile}`}
            onClick={handleActionClick}
            className="flex-1 md:hidden flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 dark:from-[#23b7f2] dark:to-[#139fe3] hover:from-purple-600 hover:to-violet-600 dark:hover:from-[#53d1ff] dark:hover:to-[#23b7f2] text-white dark:text-[#051018] rounded-xl text-xs font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            aria-label="Call"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        )}

        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            onClick={handleActionClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-[#171d24] hover:bg-purple-50 dark:hover:bg-[#1e252e] border-2 border-purple-200 dark:border-[#29556e] hover:border-purple-300 dark:hover:border-[#3cc9ff] text-purple-700 dark:text-[#7eddff] rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Email"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Email</span>
          </a>
        )}

        {teamsLink && (
          <a
            href={teamsLink}
            onClick={handleActionClick}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-[#171d24] hover:bg-purple-50 dark:hover:bg-[#1e252e] border-2 border-purple-200 dark:border-[#29556e] hover:border-purple-300 dark:hover:border-[#3cc9ff] text-purple-700 dark:text-[#7eddff] rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Teams Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Teams</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ContactCard;
