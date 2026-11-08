const stages = [
  { title:'房源与租期', en:'PROPERTY & LEASE', lead:'填写你与销售顾问确认的房源和租赁条件。', groups:[
    ['B. 房源信息 · Property details',[
      ['property','房源地址','Property address','text',1,1],['postcode','房源邮编','Postcode','text',1],
      ['bedrooms','卧室数','Bedrooms','count'],['bathrooms','浴室数','Bathrooms','count'],['parking','车位数','Car spaces','count'],
      ['moveIn','期望入住日期','Preferred move-in date','date',1],['years','租期（年）','Lease term (years)','count'],
      ['months','租期（月）','Lease term (months)','count'],['rent','周租金（AUD）','Weekly rent (AUD)','money',1],['promotion','优惠（如有）','Promotion','text'],
      ['adults','成人数','Adults','count',1],['children','儿童数','Children','count',1],['ages','儿童年龄','Children’s ages','text'],
    ]]
  ]},
  { title:'申请人资料', en:'APPLICANT DETAILS', lead:'填写一位申请人的资料。证件号码请按实际使用的证件填写。', groups:[
    ['C. 个人资料 · Personal details',[
      ['title','称谓','Title',['Mr','Ms','Miss','Mrs','Other']],
      ['surname','姓氏','Surname','text',1],['given','名字','Given name(s)','text',1],['dob','出生日期','Date of birth','date',1],
      ['licence','驾照号码','Driver’s licence number','text'],['licenceExpiry','驾照到期日','Driver’s licence expiry','date'],
      ['licenceState','驾照签发州','Driver’s licence state','text'],['passport','护照号码','Passport number','text'],['country','护照签发国','Passport country','text'],
      ['furniture','需要家具吗？','Furniture required?',['Yes','No']],['appliances','需要电器吗？','Appliances required?',['Yes','No']],
    ]],
    ['联系方式 · Contact details',[
      ['homePhone','住宅电话','Home phone','tel'],['mobile','手机号码','Mobile phone','tel',1],['workPhone','工作电话','Work phone','tel'],['fax','传真','Fax','tel'],
      ['email','电子邮箱','Email','email',1,1],['currentAddress','现住址','Current address','text',1,1],['currentPostcode','现住址邮编','Current postcode','text'],
    ]]
  ]},
  { title:'附加资料与付款', en:'CONTACTS & PAYMENTS', lead:'填写公用服务偏好、紧急联系人和与销售确认的费用。', groups:[
    ['D. 公用服务 · Utility connections',[
      ['utility','需要协助开通水电等公用服务吗？','Utility connection assistance',['No — I will arrange my own utilities','Yes — Please help me connect utilities'],1,1],
    ]],
    ['F. 车辆与宠物 · Vehicle and pets',[
      ['registration','车牌号','Car registration','text'],['vehicle','车辆品牌／车型','Make / type','text'],
      ['pets','宠物资料（如有）','Pet breed / type, inside / outside, council registration','textarea',0,1],
    ]],
    ...[1,2].map(i=>['G. 紧急联系人 '+i+' · Direct relative '+i,[
      ['relativeSurname'+i,'姓氏','Contact '+i+' surname','text',1],['relativeGiven'+i,'名字','Contact '+i+' given name(s)','text',1],
      ['relativeRelation'+i,'与申请人的关系','Contact '+i+' relationship','text',1],['relativePhone'+i,'电话','Contact '+i+' phone','tel',1],
    ]]),
    ['H. 付款明细 · Payment details',[
      ['advance','首期预付租金（AUD）','First payment of rent in advance (AUD)','money',1],
      ['bond','押金（AUD）','Security deposit (AUD)','money',1],
      ['onSigning','签约时应付押金（AUD）','Amount payable on signing (AUD)','money',1],
    ]],
  ]},
  { title:'声明与两处签字', en:'DECLARATION & SIGNATURES', lead:'阅读各项条款后，用手指或鼠标在两个签名框分别签字。', groups:[
    ['E. 申请声明 · Declaration',[
      ['sales','销售顾问姓名','Sales consultant','text',1],['salesEmail','销售邮箱（选填，留空发给租赁团队）','Sales email','email'],
      ['agreement','我已阅读销售提供的租赁协议样本及相关附件，并确认本次申请信息。','Applicant confirms review of the sample agreement and related attachments','check',1,1],
    ]],
    ['I. 留房费 · Holding fee',[
      ['holding','留房费（AUD）','Holding fee (AUD)','money',1],
    ]],
  ]},
  { title:'检查并导出', en:'REVIEW & DOWNLOAD', lead:'检查关键信息与签名，下载后将 PDF 附加到邮件或发给销售顾问。', groups:[] },
];

const form = document.querySelector('#application');
const panels = document.querySelector('#panels');
const nav = document.querySelector('#steps');
const notice = document.querySelector('#notice');
const next = document.querySelector('#next');
const back = document.querySelector('#back');
const controls = new Map();
const signatures = new Map();
let step = 0;
let reached = 0;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function field([key, label, english, type, required, wide]) {
  const wrap = element('label','',wide ? 'field wide' : 'field');
  const heading = element('span',label);
  if (required) heading.append(element('b',' *','required'));
  heading.append(element('small',english));
  wrap.append(heading);
  const control = element(Array.isArray(type) ? 'select' : type === 'textarea' ? 'textarea' : 'input');
  control.name = key;
  control.required = Boolean(required);
  if (Array.isArray(type)) {
    for (const option of ['',...type]) {
      const item = element('option',option || '请选择');
      item.value = option;
      control.append(item);
    }
  } else if (type === 'textarea') {
    control.rows = 3;
    control.maxLength = 1000;
  } else {
    control.type = type === 'count' || type === 'money' ? 'number' : type === 'check' ? 'checkbox' : type;
    if (type === 'count' || type === 'money') {
      control.min = key === 'adults' ? '1' : '0';
      control.step = type === 'money' ? '0.01' : '1';
    }
    if (['text','email','tel'].includes(type)) control.maxLength = 200;
  }
  if (['postcode','currentPostcode'].includes(key)) control.inputMode = 'numeric';
  wrap.append(control);
  controls.set(key, control);
  return wrap;
}

function addTerms(parent, text) {
  parent.append(element('div', text, 'terms'));
}

function signature(key, label) {
  const box = element('div','','signature');
  box.append(element('h3',label),element('p','请在下方手写签名，再填写签署日期。'));
  const pad = element('div','','sig-pad');
  const canvas = element('canvas');
  canvas.width = 1000;
  canvas.height = 300;
  canvas.setAttribute('aria-label', label + ' 手写签名区');
  pad.append(canvas);
  const actions = element('div','','sig-tools');
  const status = element('span','待签字');
  status.setAttribute('aria-live','polite');
  const clear = element('button','清除重签','secondary');
  clear.type = 'button';
  actions.append(status,clear);
  const date = field([key+'Date','签署日期','Date signed','date',1]);
  box.append(pad,actions,date);
  const pen = canvas.getContext('2d');
  pen.strokeStyle = '#17362b';
  pen.lineCap = 'round';
  pen.lineJoin = 'round';
  pen.lineWidth = 5;
  let active = null;
  let hasInk = false;
  let last;
  const position = event => {
    const r = canvas.getBoundingClientRect();
    return [(event.clientX-r.left)*canvas.width/r.width,(event.clientY-r.top)*canvas.height/r.height];
  };
  canvas.addEventListener('pointerdown', event => {
    if (active !== null || event.button !== 0) return;
    active = event.pointerId;
    canvas.setPointerCapture(active);
    last = position(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (active !== event.pointerId) return;
    const point = position(event);
    if (Math.hypot(point[0]-last[0],point[1]-last[1]) < 2) return;
    pen.beginPath();
    pen.moveTo(...last);
    pen.lineTo(...point);
    pen.stroke();
    last = point;
    hasInk = true;
    status.textContent = '已签字';
    notice.textContent = '';
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(type,event => { if (event.pointerId === active) active = null; });
  }
  clear.addEventListener('click', () => {
    pen.clearRect(0,0,canvas.width,canvas.height);
    hasInk = false;
    status.textContent = '待签字';
  });
  signatures.set(key,{canvas,box,hasInk:()=>hasInk,clear:()=>clear.click()});
  return box;
}

for (const [index, stage] of stages.entries()) {
  const panel = element('section','','panel');
  const title = element('h2',stage.title);
  title.tabIndex = -1;
  panel.append(element('div',`STEP 0${index+1} / ${stage.en}`,'kicker'),title,element('p',stage.lead,'lead'));
  for (const [heading, fields] of stage.groups) {
    const group = element('section','','group');
    const grid = element('div','','grid');
    group.append(element('h3',heading),grid);
    for (const definition of fields) grid.append(field(definition));
    if (heading.startsWith('D.')) {
      const info = element('details');
      info.append(element('summary','查看公用服务开通流程与说明'));
      addTerms(info,terms.utilities);
      group.append(info);
    }
    if (heading.startsWith('E.')) {
      addTerms(group,terms.declaration);
      group.append(signature('declaration','签字 1 · 申请声明'));
    }
    if (heading.startsWith('I.')) {
      addTerms(group,terms.holding);
      group.append(signature('holding','签字 2 · 留房费条款'));
    }
    panel.append(group);
  }
  if (index === 4) {
    panel.append(element('div','','review'));
    const id = element('details','','group');
    id.append(element('summary','J. 查看 100 分身份证明材料清单'));
    addTerms(id,terms.id);
    panel.append(id,element('div','','send'));
  }
  panels.append(panel);
  const jump = element('button');
  jump.type = 'button';
  jump.append(element('span',String(index+1).padStart(2,'0'),'stepnum'),document.createTextNode(stage.title));
  jump.addEventListener('click',()=>navigate(index));
  nav.append(jump);
}

const value = key => controls.get(key).value.trim();
function reportValue(key) {
  const control = controls.get(key);
  return control.type === 'checkbox' ? (control.checked ? 'Yes' : '—') : value(key) || '—';
}

function renderReview() {
  const review = document.querySelector('.review');
  review.replaceChildren();
  for (const [index, stage] of stages.slice(0,4).entries()) {
    const row = element('details','','overview group');
    row.open = index === 0;
    row.append(element('summary',stage.title));
    for (const [heading,fields] of stage.groups) {
      row.append(element('h4',heading));
      for (const [key,label] of fields) row.append(element('p',label + ' · ' + reportValue(key)));
    }
    review.append(row);
  }
  const line = element('p',`已签署申请声明（${value('declarationDate')}）及留房费条款（${value('holdingDate')}）。`,'terms');
  review.append(line);
}

function render(focus) {
  for (const [i,panel] of [...panels.children].entries()) {
    panel.hidden = i !== step;
    for (const control of panel.querySelectorAll('input, textarea, select')) control.disabled = i !== step;
  }
  for (const [i,jump] of [...nav.children].entries()) {
    jump.disabled = i > reached;
    if (i === step) jump.setAttribute('aria-current','step');
    else jump.removeAttribute('aria-current');
  }
  document.querySelector('#mobile-progress').textContent = `步骤 ${step+1} / ${stages.length} · ${stages[step].title}`;
  back.hidden = step === 0;
  next.textContent = step === 4 ? '下载签字版 PDF' : '继续 →';
  notice.textContent = '';
  notice.className = '';
  if (step === 4) {
    renderReview();
    document.querySelector('.send').replaceChildren();
  }
  if (focus) {
    panels.children[step].querySelector('h2').focus({preventScroll:true});
    document.querySelector('main').scrollIntoView({block:'start'});
  }
}

function checkStage(index) {
  for (const control of panels.children[index].querySelectorAll('input, textarea, select')) {
    control.setCustomValidity('');
    if (!control.checkValidity()) {
      control.reportValidity();
      return false;
    }
    if (control.required && control.type === 'text' && !control.value.trim()) {
      control.setCustomValidity('请填写此项。');
      control.reportValidity();
      return false;
    }
  }
  if (index === 0 && !(Number(value('years')) || Number(value('months')))) {
    notice.textContent = '请填写大于零的租期。';
    controls.get('years').focus();
    return false;
  }
  if (index === 3) {
    if (Number(value('holding')) > Number(value('rent'))) {
      notice.textContent = '留房费不能超过一周租金，请与销售顾问核对金额。';
      controls.get('holding').focus();
      return false;
    }
    for (const sig of signatures.values()) {
      if (!sig.hasInk()) {
        notice.textContent = '请先完成两处手写签名。';
        sig.box.scrollIntoView({block:'center'});
        return false;
      }
    }
  }
  return true;
}

function navigate(target) {
  while (step < target) {
    if (!checkStage(step)) return;
    step += 1;
    reached = Math.max(reached,step);
    render(false);
  }
  step = target;
  render(true);
}
form.noValidate = true;
form.addEventListener('input', event => {
  event.target.setCustomValidity?.('');
  notice.textContent = '';
  if (!['declarationDate','holdingDate','salesEmail'].includes(event.target.name)) {
    for (const [key,sig] of signatures) {
      if (key === 'declaration' && event.target.name === 'holding') continue;
      if (sig.hasInk()) {
        sig.clear();
        notice.textContent = '申请内容已修改，请重新签字。';
      }
    }
  }
});
back.addEventListener('click',()=>navigate(step-1));
form.addEventListener('submit',event=>{
  event.preventDefault();
  if (step < 4) return navigate(step+1);
  try {
    const pdf = buildReport();
    const url = URL.createObjectURL(pdf);
    const link = element('a');
    link.href = url;
    link.download = 'Inndeavor-Tenancy-Application.pdf';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    const sent = document.querySelector('.send');
    sent.className = 'send send-box';
    const email = element('a','打开邮件草稿');
    const recipient = value('salesEmail') || 'rentalteam@inndeavor.com';
    email.href = 'mailto:'+encodeURIComponent(recipient)+'?subject='+encodeURIComponent('Inndeavor Tenancy Application')+'&body='+encodeURIComponent('Hi,\n\nPlease find my signed tenancy application attached.\n\nThank you.');
    sent.replaceChildren(element('strong','PDF 已生成'),element('p','打开邮件草稿，附上刚下载的 PDF，再发送至 '+recipient+'。'),email);
  } catch (error) {
    console.error(error);
    notice.textContent = 'PDF 未能生成。请保留当前页面并重试。';
  }
});
render(false);
