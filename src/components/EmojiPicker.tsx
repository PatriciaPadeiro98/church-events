const EMOJIS = [
  '📦', '💧', '🥤', '🍺', '🍔', '🍟', '🥪', '🧃', '☕', '🍰',
  '🍪', '🥐', '🍞', '🧁', '🍩', '🥤', '🧋', '🍷', '🍸', '🍹',
  '🥃', '🍲', '🍛', '🍝', '🍜', '🍱', '🍣', '🍤', '🥘', '🍳',
  '🥞', '🧈', '🍯', '🥛', '🍶', '🧂', '🥄', '🍴', '🥢', '🍽',
  '🍷', '🍾', '🧉', '🧊', '🥐', '🥯', '🍠', '🥔', '🍠', '🌽',
  '🥕', '🥗', '🥬', '🥒', '🌶', '🌽', '🍅', '🥥', '🥑', '🍆',
  '🥔', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
  '🍑', '🥭', '🍍', '🥥', '🥝', '🍎', '🍏', '🍗', '🍖', '🌭',
];

type EmojiPickerProps = {
  onSelectEmoji: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export const EmojiPicker = ({
  onSelectEmoji,
  isOpen,
  onClose,
}: EmojiPickerProps) => {
  if (!isOpen) return null;

  return (
    <div className="emoji-picker-overlay" onClick={onClose}>
      <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
        <div className="emoji-picker-header">
          <h4>Seleciona um Emoji</h4>
          <button className="emoji-picker-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="emoji-grid">
          {EMOJIS.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              className="emoji-button"
              onClick={() => {
                onSelectEmoji(emoji);
                onClose();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
