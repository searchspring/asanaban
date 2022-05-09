const avatarColors = [
    "#f06a6a",
    "#4573d2",
    "#5da283",
    "#4ecbc4",
    "#8d84e8",
    "#b36bd4",
    "#f26fb2",
];

// Assigns a color to the icon based on the assignee's name, similar to Asana's behavior.
// Hashing function based on https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript.
const getAvatarColor = (name: string | null | undefined) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; ++i) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return avatarColors[-(hash % avatarColors.length)];
};

export default getAvatarColor;