const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'src/channels/channels.service.ts',
  'src/channels/channels.controller.ts',
  'src/auth/auth.service.ts',
  'src/suggestion/suggestion.service.ts',
  'src/story/story.service.ts',
  'src/story/storyTransaction.ts',
  'src/story/storysql.ts'
];

filesToPatch.forEach(relPath => {
  const fullPath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace link template strings e.g. `/channelUpload/${imageFile.filename}`
  content = content.replace(/`\/(upload|channelUpload|suggestionUpload|videoUpload|userUpload)\/\$\{(\w+)\.filename\}`/g, 
    `(($2 as any).location || \`/$1/\${$2.filename}\`)`);
    
  // Replace direct link strings like `/upload/${file.filename}` if they were not matched by above (already in backticks, so the above matches backticks)
  // For case where it's `src="/upload/${file.filename}"` -> `src="${((file as any).location || \`/upload/\${file.filename}\`)}"`
  content = content.replace(/`src="\/(upload|channelUpload|suggestionUpload|videoUpload|userUpload)\/\$\{(\w+)\.filename\}"`/g, 
    `\`src="\${($2 as any).location || \`/$1/\${$2.filename}\`}"\``);

  // Replace filename accesses e.g. file.filename -> ((file as any).key || file.filename)
  // Need to be careful not to double replace if we just replaced something inside a template literal.
  // We can just replace .filename where it's not inside a template literal or string.
  // A safe way is to just do `.filename` -> `.filename` after doing `.location || file.filename`.
  // Wait, let's just do a simple replacement for the DB saving part:
  content = content.replace(/(\w+)\.filename/g, match => {
    // If it's already part of the `(($2 as any).location || \`/$1/\${$2.filename}\`)` structure, skip it
    // Or just do a blind replace and then fix the string interpolation if needed.
    return match; // Actually it's better to do targeted replacements.
  });

  // Targeted replacements for .filename:
  content = content.replace(/imageFile\.filename/g, '((imageFile as any).key || imageFile.filename)');
  content = content.replace(/profileImage\.filename/g, '((profileImage as any).key || profileImage.filename)');
  content = content.replace(/file\.filename/g, '((file as any).key || file.filename)');

  // Fix up the template literals we broke by replacing `file.filename` inside them.
  // `/$1/${((file as any).key || file.filename)}`
  // Actually, let's just replace `((file as any).key || file.filename)` inside the template literal fallback back to `${file.filename}`.
  content = content.replace(/\(\(file as any\)\.location \|\| `\/(\w+)\/\$\{\(\(file as any\)\.key \|\| file\.filename\)\}`\)/g, 
    `((file as any).location || \`/$1/\${file.filename}\`)`);
  content = content.replace(/\(\(imageFile as any\)\.location \|\| `\/(\w+)\/\$\{\(\(imageFile as any\)\.key \|\| imageFile\.filename\)\}`\)/g, 
    `((imageFile as any).location || \`/$1/\${imageFile.filename}\`)`);
  content = content.replace(/\(\(profileImage as any\)\.location \|\| `\/(\w+)\/\$\{\(\(profileImage as any\)\.key \|\| profileImage\.filename\)\}`\)/g, 
    `((profileImage as any).location || \`/$1/\${profileImage.filename}\`)`);

  fs.writeFileSync(fullPath, content, 'utf8');
});

console.log('Usage patched.');
