import app from './app.js';
import { PORT } from './config/index.js';
import chalk from 'chalk';

app.listen(PORT, () => {
  console.log(chalk.bgBlue(chalk.white(`🚀 Server is running on port ${PORT} with Node.js version ${process.version}`)));
  console.log(chalk.bgGreen(chalk.black('🔧 Server Status: Everything is running smoothly!')));
});