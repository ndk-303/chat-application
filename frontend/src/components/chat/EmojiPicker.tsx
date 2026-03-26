import { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  /** Ref của nút trigger để tính position */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

// ── Emoji data ──────────────────────────────────────────────────────────────
const EMOJI_TABS = [
  {
    label: '😊',
    title: 'Smileys',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
      '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
      '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
      '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧',
      '🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐',
      '😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦',
      '😧','😨','😰','😥','😢','😭','😱','😖','😣','😞',
      '😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿',
    ],
  },
  {
    label: '👋',
    title: 'People',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞',
      '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍',
      '👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝',
      '🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂',
      '🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅',
      '👄','🫦','💋','👣','🧬','🦠','💊','🩺','🩻','🧪',
    ],
  },
  {
    label: '🐶',
    title: 'Animals',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
      '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
      '🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
      '🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂',
      '🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀',
      '🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆',
    ],
  },
  {
    label: '🍕',
    title: 'Food',
    emojis: [
      '🍕','🍔','🌮','🌯','🥙','🧆','🍟','🌭','🍿','🧂',
      '🥚','🍳','🥞','🧈','🥓','🥩','🍗','🍖','🦴','🌽',
      '🥦','🥬','🥒','🌶️','🫑','🧄','🧅','🍆','🥑','🍅',
      '🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🍌',
      '🍋','🍊','🍎','🍏','🍐','🍑','🍷','🍸','🍹','🧃',
      '🍵','☕','🧋','🥤','🍺','🥂','🍾','🫖','🥛','🍼',
    ],
  },
  {
    label: '⚽',
    title: 'Activity',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱',
      '🪀','🏓','🏸','🏒','🥊','🥋','🎽','🛹','🛷','⛸️',
      '🤸','⛹️','🤺','🤼','🤾','🏌️','🏇','🧘','🏄','🤽',
      '🚴','🏊','🧗','🤿','🏋️','🤼','🏆','🥇','🥈','🥉',
      '🏅','🎖️','🎗️','🎪','🎠','🎡','🎢','🎭','🎨','🖼️',
      '🎬','🎤','🎧','🎼','🎹','🎸','🎺','🎻','🥁','🎲',
    ],
  },
  {
    label: '🌍',
    title: 'Travel',
    emojis: [
      '🌍','🌎','🌏','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️',
      '🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🏘️','🏚️','🏠',
      '🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫',
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐',
      '✈️','🚀','🛸','🚁','🛶','⛵','🚢','🚂','🚃','🚄',
      '🌈','⛅','🌤️','🌦️','🌧️','⛈️','🌩️','🌪️','🌫️','🌬️',
    ],
  },
  {
    label: '💡',
    title: 'Objects',
    emojis: [
      '💡','🔦','🕯️','🪔','💰','💴','💵','💶','💷','💸',
      '💳','🪙','💎','⚖️','🔧','🔨','⚒️','🛠️','⛏️','🔩',
      '🪛','🔫','🧲','🪜','🧰','🪝','🧲','🔋','🪫','💻',
      '📱','📲','☎️','📞','📟','📠','📺','📻','🎙️','📡',
      '🔭','🔬','🩺','🩻','💊','🧪','🧫','🧬','🔑','🗝️',
      '🔐','🔏','🔒','🔓','🚪','🪟','🪞','🛋️','🪑','🚽',
    ],
  },
  {
    label: '❤️',
    title: 'Symbols',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
      '✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐',
      '♈','♉','♊','♋','♌','♍','♎','♏','♐','♑',
      '✨','⭐','🌟','💫','⚡','🔥','💥','❄️','🌊','🌀',
      '🎉','🎊','🎈','🎀','🎁','🎗️','🏮','✅','❌','⭕',
    ],
  },
];

const PICKER_WIDTH = 288;  // w-72 = 18rem = 288px
const PICKER_HEIGHT = 340; // estimated

// ── Component ────────────────────────────────────────────────────────────────
export function EmojiPicker({ onSelect, onClose, triggerRef }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Compute fixed position relative to trigger button
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: open upward, left-aligned with the trigger
    let top = rect.top - PICKER_HEIGHT - 8;
    let left = rect.left;

    // If not enough space above, open downward
    if (top < 8) top = rect.bottom + 8;
    // If overflows right edge, align to right
    if (left + PICKER_WIDTH > vw - 8) left = vw - PICKER_WIDTH - 8;
    // Clamp left
    if (left < 8) left = 8;
    // Clamp top
    if (top + PICKER_HEIGHT > vh - 8) top = vh - PICKER_HEIGHT - 8;

    setPos({ top, left });
  }, [triggerRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        triggerRef?.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // Small delay so the toggle click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose, triggerRef]);

  // Filter emojis based on query
  const allEmojis = EMOJI_TABS.flatMap((t) => t.emojis);
  const displayedEmojis = query.trim()
    ? allEmojis.filter((e) => e.includes(query))
    : EMOJI_TABS[activeTab].emojis;

  return (
    <div
      ref={pickerRef}
      className="fixed z-[9999] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden"
      style={{
        width: PICKER_WIDTH,
        top: pos.top,
        left: pos.left,
        boxShadow: '0 8px 32px rgba(0,104,255,0.12)',
      }}
    >
      {/* Search */}
      <div className="p-2 border-b border-[#E5E7EB]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm emoji..."
          autoFocus
          className="w-full px-3 py-1.5 text-sm rounded-xl bg-[#F0F2F5] outline-none focus:ring-2 focus:ring-[#0068FF]/30 placeholder:text-gray-400"
        />
      </div>

      {/* Tabs */}
      {!query.trim() && (
        <div className="flex border-b border-[#E5E7EB] overflow-x-auto no-scrollbar">
          {EMOJI_TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              title={tab.title}
              className={`flex-shrink-0 px-2.5 py-2 text-base transition-colors ${
                activeTab === i
                  ? 'border-b-2 border-[#0068FF] bg-[#EEF5FF]'
                  : 'hover:bg-[#F0F2F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-8 gap-0 p-1.5 max-h-52 overflow-y-auto no-scrollbar">
        {displayedEmojis.map((emoji, i) => (
          <button
            key={i}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-[#EEF5FF] transition-colors active:scale-90"
          >
            {emoji}
          </button>
        ))}
        {displayedEmojis.length === 0 && (
          <div className="col-span-8 py-4 text-center text-sm text-gray-400">
            Không tìm thấy emoji
          </div>
        )}
      </div>
    </div>
  );
}
