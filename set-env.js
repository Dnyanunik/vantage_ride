const fs = require('fs');

const targetPath = './src/environments/environment.ts';
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}'
};
`;

// Creates the directory if it doesn't exist
fs.mkdirSync('./src/environments', { recursive: true });

// Writes the file so Angular can find it during the build!
fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated correctly at ${targetPath} \n`);
