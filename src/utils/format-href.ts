export default function formatHref(href:string) {
  const parts = href.replace(/^\/+|\/+$/g, '').split('/');

  // Remove 'youtube' if it exists
  if (parts[0] === 'youtube') {
    parts.shift();
  }

  // Format as "main-folder (sub-folder)"
  if (parts.length >= 2) {
    const main = parts[0];
    const sub = parts[1];
    return `${main} (${sub})`;
  } else {
    // If only one part
    return parts[0] || '';
  }
}

// Example usage:
const href = "/youtube/chai-aur-html/html-tags/";
const formattedHref = formatHref(href);

console.log(formattedHref); 
// Output: "chai-aur-html (html-tags)"
