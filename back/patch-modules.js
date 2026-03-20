const fs = require('fs');
const path = require('path');

const applyRegexReplace = (filePath, regex, replacement) => {
  const fullPath = path.resolve(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(fullPath, content, 'utf8');
};

// 1. Update Modules
const modulesToUpdate = [
  { path: 'src/auth/auth.module.ts', folder: 'userUpload' },
  { path: 'src/channels/channels.module.ts', folder: 'channelUpload' },
  { path: 'src/story/story.module.ts', folder: 'upload' }, // We will handle videoUpload separately if needed, but it seems story.module uses 'upload' and 'videoUpload' config? Wait, story.module.ts might only have one or two MulterModule.register calls.
  { path: 'src/suggestion/suggestion.module.ts', folder: 'suggestionUpload' },
];

const multerRegex = /MulterModule\.register\(\{\s*storage:\s*diskStorage\(\{[\s\S]*?\}\),\s*limits:\s*\{[^}]+\},\s*\}\)/g;
const multerImportRegex = /import\s*\{\s*diskStorage\s*\}\s*from\s*'multer';/g;

modulesToUpdate.forEach(mod => {
  const fullPath = path.resolve(__dirname, mod.path);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (!content.includes('getMulterOptions')) {
    content = content.replace(
      /import\s*\{\s*MulterModule\s*\}\s*from\s*'@nestjs\/platform-express';/,
      `import { MulterModule } from '@nestjs/platform-express';\nimport { getMulterOptions } from '../common/utils/multer.options';`
    );
  }

  content = content.replace(multerRegex, `MulterModule.registerAsync({\n      useFactory: () => getMulterOptions('${mod.folder}'),\n    })`);
  fs.writeFileSync(fullPath, content, 'utf8');
});

console.log('Modules updated');
