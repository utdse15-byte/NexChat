export function createSSEParser() {
  let buffer = '';

  const parse = (chunk: string): string[] => {
    buffer += chunk;
    const events: string[] = [];
    
    // Normalize newlines to \n
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const eventText = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      
      if (eventText) {
        events.push(eventText);
      }
      
      boundary = buffer.indexOf('\n\n');
    }
    
    return events;
  };

  const getRest = () => buffer;
  
  return { parse, getRest };
}

export function extractDataFromEvent(eventText: string): string[] {
  const lines = eventText.split('\n');
  const dataLines: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith(':')) continue; // Comment
    
    if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6));
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5));
    }
  }
  
  return dataLines;
}
