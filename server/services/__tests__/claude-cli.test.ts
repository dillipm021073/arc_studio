import { ClaudeCLIService } from '../claude-cli.service';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

// Example usage and tests
async function testClaudeCLI() {
  const claude = new ClaudeCLIService();

  console.log('Running Claude CLI tests...\n');

  // 1. Health check
  console.log('1. Health Check:');
  const health = await claude.healthCheck();
  console.log('Health status:', health);
  console.log('---\n');

  // 2. Simple text query
  console.log('2. Simple Text Query:');
  try {
    const response = await claude.query('What is the capital of France? Just give the city name.');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('---\n');

  // 3. JSON response query
  console.log('3. JSON Response Query:');
  try {
    const response = await claude.query(
      'What is 2+2? Respond with just the number.',
      { outputFormat: 'json' }
    );
    console.log('JSON Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('---\n');

  // 4. Document parsing
  console.log('4. Document Parsing:');
  const testFilePath = path.join('/tmp', 'test-document.txt');
  try {
    // Create a test document
    await writeFile(testFilePath, `
      Application Interface Tracker Requirements
      
      This system tracks:
      - Applications (AML)
      - Interfaces (IML)
      - Business Processes
      - Change Requests
      
      Key features include timeline visualization and impact analysis.
    `);

    const analysis = await claude.parseDocument(
      testFilePath,
      'Summarize the main components mentioned in this document'
    );
    console.log('Document Analysis:', analysis);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    await unlink(testFilePath).catch(() => {});
  }
  console.log('---\n');

  // 5. Structured data extraction
  console.log('5. Structured Data Extraction:');
  try {
    interface ExtractedData {
      name: string;
      age: number;
      city: string;
    }

    const text = 'John Smith is 28 years old and lives in New York City.';
    const schema = `{
      "name": "string - person's full name",
      "age": "number - person's age",
      "city": "string - city where person lives"
    }`;

    const data = await claude.extractStructuredData<ExtractedData>(text, schema);
    console.log('Extracted Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('---\n');

  // 6. Streaming example (commented out to avoid long output)
  console.log('6. Streaming Response:');
  console.log('(Streaming example - uncomment to test)');
  /*
  try {
    const stream = claude.streamQuery('Write a short story about a robot learning to paint.');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  }
  */
}

// Run tests if this file is executed directly
if (require.main === module) {
  testClaudeCLI().catch(console.error);
}