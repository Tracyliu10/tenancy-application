// Render text and handwritten signatures with the device's fonts, including CJK.
function buildReport() {
  const width = 1190;
  const height = 1684;
  const margin = 78;
  const pages = [];
  let canvas;
  let ctx;
  let y;

  function text(text, x, baseline, size, color, bold = false) {
    ctx.font = `${bold ? 700 : 400} ${size}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, baseline);
  }

  function startPage() {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#102d24';
    ctx.fillRect(0,0,width,116);
    text('INNDEAVOR',margin,73,34,'#e1f1cb',true);
    ctx.textAlign = 'right';
    text(t('租房申请','TENANCY APPLICATION'),width-margin,73,22,'#ffffff',true);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#dbe5dc';
    ctx.fillRect(margin,height-91,width-2*margin,2);
    text(t('Inndeavor  |  租房申请表','Inndeavor  |  Tenancy Application Form'),margin,height-48,19,'#3c5b4e');
    ctx.textAlign = 'right';
    text(String(pages.length+1),width-margin,height-48,19,'#3c5b4e');
    ctx.textAlign = 'left';
    y = 166;
    pages.push(canvas);
  }

  function ensure(space) {
    if (y + space > height - 116) startPage();
  }

  function paragraph(content, size = 23, bold = false, color = '#102822') {
    const advance = Math.ceil(size * 1.42);
    for (const line of content.split('\n')) {
      let current = '';
      for (const part of line.match(/\s+|[^\s]+/gu) || []) {
        ctx.font = `${bold ? 700 : 400} ${size}px system-ui, sans-serif`;
        if (ctx.measureText(current+part).width > width-2*margin && current.trim()) {
          ensure(advance);
          text(current.trimEnd(),margin,y,size,color,bold);
          y += advance;
          current = '';
        }
        for (const character of part) {
          ctx.font = `${bold ? 700 : 400} ${size}px system-ui, sans-serif`;
          if (ctx.measureText(current+character).width > width-2*margin) {
            ensure(advance);
            text(current,margin,y,size,color,bold);
            y += advance;
            current = '';
          }
          if (current || character.trim()) current += character;
        }
      }
      ensure(advance);
      text(current.trimEnd(),margin,y,size,color,bold);
      y += advance;
    }
  }

  function heading(label) {
    y += 15;
    ensure(120);
    ctx.fillStyle = '#e9f2e4';
    ctx.fillRect(margin,y-28,width-2*margin,45);
    text(label,margin+14,y+2,25,'#174939',true);
    y += 57;
  }

  function drawSignature(key, label) {
    y += 18;
    ensure(218);
    paragraph(label+t('  |  签署日期：','  |  Date signed: ')+value(key+'Date'),23,true);
    ctx.fillStyle = '#f4f7f2';
    ctx.fillRect(margin,y-10,500,150);
    ctx.drawImage(signatures.get(key).canvas,margin,y-10,500,150);
    y += 165;
  }

  startPage();
  paragraph(t('签字版租房申请','Signed tenancy application'),43,true);
  paragraph(t(value('surname')+' '+value('given'),value('given')+' '+value('surname'))+'  |  '+value('property'),26);
  heading(t('A. 房屋提供方','A. Accommodation provider'));
  paragraph('INNDEAVOR · Suite 14.01/55 Clarence Street, Sydney NSW 2000');
  paragraph('(02) 9739 8988 · rentalteam@inndeavor.com');
  const groups = stages.flatMap(stage=>stage.groups);
  for (const letter of ['B','C','D','E','F','G','H','I']) {
    const list = groups.filter(([heading])=>heading.startsWith(letter+'.'));
    if (letter === 'C') list.push(groups.find(([heading])=>heading.startsWith('联系方式')));
    for (const [name,fields] of list) {
      heading(groupLabel(name));
      for (const [key,label,english] of fields) paragraph(t(label+'：',english+': ')+reportValue(key));
      if (letter === 'D' && value('utility').startsWith('Yes')) {
        y += 10;
        paragraph(displayTerms('utilities'),20);
      }
      if (letter === 'E') {
        y += 10;
        paragraph(displayTerms('declaration'),20);
        drawSignature('declaration',signTitle('declaration'));
      }
      if (letter === 'I') {
        y += 10;
        paragraph(displayTerms('holding'),20);
        drawSignature('holding',signTitle('holding'));
      }
    }
  }
  heading(t('J. 100 分身份证明材料','J. 100 points of ID required'));
  paragraph(displayTerms('id'),20);
  heading(t('房屋提供方专用','Accommodation provider use only'));
  paragraph(t('签字：_____________________    日期：__________________','Signature: _______________________    Date: __________________'));
  paragraph(t('租赁经理：________________    口译语言：________________','Leasing manager: ________________    Interpreter language: ________________'));
  return encodePdf(pages);
}

// A standard PDF with one JPEG XObject per A4 page, requiring no network libraries.
function encodePdf(pages) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  function append(data) {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  }
  function object(id, body, bytes) {
    offsets[id] = length;
    append(id+' 0 obj\n'+body);
    if (bytes) {
      append('\nstream\n');
      append(bytes);
      append('\nendstream');
    }
    append('\nendobj\n');
  }
  append('%PDF-1.4\n');
  append(new Uint8Array([37,226,227,207,211,10]));
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>3+i*3+' 0 R').join(' ')}] >>`);
  for (const [index,page] of pages.entries()) {
    const id = 3+index*3;
    const jpeg = Uint8Array.from(atob(page.toDataURL('image/jpeg',0.92).split(',')[1]),c=>c.charCodeAt(0));
    const stream = encoder.encode('q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n');
    object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    object(id+1,`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,jpeg);
    object(id+2,`<< /Length ${stream.length} >>`,stream);
  }
  const xref = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (const offset of offsets.slice(1)) append(String(offset).padStart(10,'0')+' 00000 n \n');
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks,{type:'application/pdf'});
}
