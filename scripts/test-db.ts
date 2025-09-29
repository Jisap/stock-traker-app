import { connectToDatabase } from "@/database/mongoose";


async function main() {
  try {
    await connectToDatabase()
    console.log('Connected to database');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to database:', error);
    console.error(error)
    process.exit(1);
  }

}

main();
