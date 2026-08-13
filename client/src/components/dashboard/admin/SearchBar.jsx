import "./SearchBar.css";

function SearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Search predictions...",
}) {
  return (
    <div className="search-bar">

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch();
          }
        }}
      />

      <button
        className="search-btn"
        onClick={onSearch}
      >
        🔍 Search
      </button>

      <button
        className="clear-btn"
        onClick={onClear}
      >
        Clear
      </button>

    </div>
  );
}

export default SearchBar;