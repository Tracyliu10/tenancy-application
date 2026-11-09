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
      ['agreement','我已阅读销售提供的租赁协议样本及相关附件，并确认本次申请信息。','I have read the sample lease and related attachments provided by the sales team and confirm my application details.','check',1,1],
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
let reportUrl = null;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function field([key, label, english, type, required, wide]) {
  const wrap = element('label','',wide ? 'field wide' : 'field');
  const heading = element('span');
  const title = document.createTextNode('');
  heading.append(title);
  localized.push(() => { title.data = t(label,english); });
  if (required) heading.append(element('b',' *','required'));
  if (type !== 'check') {
    const subtitle = element('small',english);
    heading.append(subtitle);
    localized.push(() => { subtitle.hidden = language === 'en'; });
  }
  wrap.append(heading);
  const control = element(Array.isArray(type) ? 'select' : type === 'textarea' ? 'textarea' : 'input');
  control.name = key;
  control.required = Boolean(required);
  if (Array.isArray(type)) {
    for (const option of ['',...type]) {
      const item = translated('option',()=>optionLabel(option));
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
  const placeholders = {surname:'Zhang', given:'San', property:'12 George Street, Sydney NSW', currentAddress:'12 George Street, Sydney NSW', relativeSurname1:'Zhang', relativeSurname2:'Zhang', relativeGiven1:'San', relativeGiven2:'San'};
  if (placeholders[key]) control.placeholder = placeholders[key];
  wrap.append(control);
  controls.set(key, control);
  return wrap;
}

function addTerms(parent, text) {
  parent.append(translated('div',()=>displayTerms(text,true),'terms'));
}

function signature(key) {
  const box = element('div','','signature');
  box.append(translated('h3',()=>signTitle(key)),translated('p',()=>t('请在下方手写签名，再填写签署日期。','Sign by hand below, then enter the signing date.')));
  const pad = element('div','','sig-pad');
  const canvas = element('canvas');
  canvas.width = 1000;
  canvas.height = 300;
  localized.push(()=>canvas.setAttribute('aria-label',signTitle(key)));
  pad.append(canvas);
  const actions = element('div','','sig-tools');
  const status = element('span');
  const updateStatus = () => { status.textContent = hasInk ? t('已签字','Signed') : t('待签字','Awaiting signature'); };
  localized.push(updateStatus);
  status.setAttribute('aria-live','polite');
  const clear = translated('button',()=>t('清除重签','Clear signature'),'secondary');
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
    updateStatus();
    notice.textContent = '';
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(type,event => { if (event.pointerId === active) active = null; });
  }
  clear.addEventListener('click', () => {
    pen.clearRect(0,0,canvas.width,canvas.height);
    hasInk = false;
    updateStatus();
  });
  signatures.set(key,{canvas,box,hasInk:()=>hasInk,clear:()=>clear.click()});
  return box;
}

for (const [index, stage] of stages.entries()) {
  const panel = element('section','','panel');
  const title = translated('h2',()=>t(stage.title,stageTitles[index]));
  title.tabIndex = -1;
  panel.append(element('div',`STEP 0${index+1} / ${stage.en}`,'kicker'),title,translated('p',()=>t(stage.lead,stageLeads[index]),'lead'));
  for (const [heading, fields] of stage.groups) {
    const group = element('section','','group');
    const grid = element('div','','grid');
    group.append(translated('h3',()=>groupLabel(heading)),grid);
    for (const definition of fields) grid.append(field(definition));
    if (heading.startsWith('D.')) {
      const info = element('details');
      info.append(translated('summary',()=>t('查看公用服务开通流程与说明','View utility connection information')));
      addTerms(info,'utilities');
      group.append(info);
    }
    if (heading.startsWith('E.')) {
      addTerms(group,'declaration');
      group.append(signature('declaration'));
    }
    if (heading.startsWith('I.')) {
      addTerms(group,'holding');
      group.append(signature('holding'));
    }
    panel.append(group);
  }
  if (index === 4) {
    panel.append(element('div','','review'));
    const id = element('details','','group');
    id.append(translated('summary',()=>t('J. 查看 100 分身份证明材料清单','J. View the 100-point identification checklist')));
    addTerms(id,'id');
    panel.append(id,element('div','','send'));
  }
  panels.append(panel);
  const jump = element('button');
  jump.type = 'button';
  jump.append(element('span',String(index+1).padStart(2,'0'),'stepnum'),translated('span',()=>t(stage.title,stageTitles[index])));
  jump.addEventListener('click',()=>navigate(index));
  nav.append(jump);
}

const value = key => controls.get(key).value.trim();
function reportValue(key) {
  const control = controls.get(key);
  if (control.type === 'checkbox') return control.checked ? t('是','Yes') : '—';
  const answer = value(key);
  return control.tagName === 'SELECT' && answer ? optionLabel(answer) : answer || '—';
}

function renderReview() {
  const review = document.querySelector('.review');
  review.replaceChildren();
  for (const [index, stage] of stages.slice(0,4).entries()) {
    const row = element('details','','overview group');
    row.open = index === 0;
    row.append(element('summary',t(stage.title,stageTitles[index])));
    for (const [heading,fields] of stage.groups) {
      row.append(element('h4',groupLabel(heading)));
      for (const [key,label,english] of fields) row.append(element('p',t(label,english) + ' · ' + reportValue(key)));
    }
    review.append(row);
  }
  const line = element('p',t(`已签署申请声明（${value('declarationDate')}）及留房费条款（${value('holdingDate')}）。`,`Declaration signed ${value('declarationDate')}. Holding fee terms signed ${value('holdingDate')}.`),'terms');
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
  document.querySelector('#mobile-progress').textContent = `${t('步骤','Step')} ${step+1} / ${stages.length} · ${t(stages[step].title,stageTitles[step])}`;
  back.hidden = step === 0;
  back.textContent = t('上一步','Back');
  next.textContent = step === 4 ? t('导出签字版 PDF','Export signed PDF') : t('继续 →','Continue →');
  notice.textContent = '';
  notice.className = '';
  if (step === 4) {
    renderReview();
    const send = document.querySelector('.send');
    send.replaceChildren();
    send.className = 'send';
    if (reportUrl) URL.revokeObjectURL(reportUrl);
    reportUrl = null;
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
      control.setCustomValidity(t('请填写此项。','Please fill out this field.'));
      control.reportValidity();
      return false;
    }
    const answer = control.value.trim();
    if (answer && ['text','textarea'].includes(control.type) &&
        !/^[\p{Script=Latin}\p{M}0-9\p{P}+$&\s]+$/u.test(answer)) {
      control.setCustomValidity(t('请用英文字母填写，例如 Zhang San。可以使用数字和标点。','Use Latin letters, such as Zhang San. Numbers and punctuation are allowed.'));
      control.reportValidity();
      return false;
    }
  }
  if (index === 0 && !(Number(value('years')) || Number(value('months')))) {
    notice.textContent = t('请填写大于零的租期。','Enter a lease term greater than zero.');
    controls.get('years').focus();
    return false;
  }
  if (index === 3) {
    if (Number(value('holding')) > Number(value('rent'))) {
      notice.textContent = t('留房费不能超过一周租金，请与销售顾问核对金额。','The holding fee cannot exceed one week’s rent. Check the amount with your sales consultant.');
      controls.get('holding').focus();
      return false;
    }
    for (const sig of signatures.values()) {
      if (!sig.hasInk()) {
        notice.textContent = t('请先完成两处手写签名。','Please complete both handwritten signatures.');
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
        notice.textContent = t('申请内容已修改，请重新签字。','Application details changed. Please sign again.');
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
    const filename = `Inndeavor-Tenancy-Application-${t('CN','EN')}.pdf`;
    if (reportUrl) URL.revokeObjectURL(reportUrl);
    reportUrl = URL.createObjectURL(pdf);
    const download = element('a',t('下载 PDF','Download PDF'));
    download.href = reportUrl;
    download.download = filename;
    const preview = element('a',t('打开 PDF','Open PDF'));
    preview.href = reportUrl;
    preview.target = '_blank';
    preview.rel = 'noopener';
    const email = element('a',t('打开邮件草稿','Open email draft'));
    const recipient = value('salesEmail') || 'rentalteam@inndeavor.com';
    const subject = t('Inndeavor 租房申请','Inndeavor Tenancy Application');
    const body = t('您好，随信附上我的签字版租房申请。谢谢！','Hi, please find my signed tenancy application attached. Thank you.');
    email.href = 'mailto:'+encodeURIComponent(recipient)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    const actions = element('div','','export-actions');
    const file = new File([pdf],filename,{type:'application/pdf'});
    if (navigator.share && navigator.canShare?.({files:[file]})) {
      const share = element('button',t('分享 PDF','Share PDF'));
      share.type = 'button';
      share.addEventListener('click',async()=>{
        try {
          await navigator.share({files:[file]});
        } catch (error) {
          if (error.name !== 'AbortError') notice.textContent = t('分享失败，请试用下载或打开 PDF。','Sharing failed. Download or open the PDF instead.');
        }
      });
      actions.append(share);
    }
    actions.append(download,preview,email);
    const sent = document.querySelector('.send');
    sent.className = 'send send-box';
    const hint = t(`可直接分享文件，或下载后附到邮件发至 ${recipient}。若手机无法下载，可先打开 PDF，再用浏览器菜单保存或分享。`,`Share the file, or download and attach it to an email to ${recipient}. If your phone cannot download it, open the PDF and use your browser’s save or share menu.`);
    sent.replaceChildren(element('strong',t('PDF 已生成','PDF ready')),element('p',hint),actions);
    sent.scrollIntoView({block:'nearest'});
  } catch (error) {
    console.error(error);
    notice.textContent = t('PDF 未能生成。请保留当前页面并重试。','The PDF could not be generated. Keep this page open and try again.');
  }
});
function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = t('zh-CN','en');
  document.title = t('Inndeavor · 租房申请','Inndeavor · Tenancy Application');
  document.querySelector('.intro h1').textContent = t('租房申请','Tenancy application');
  document.querySelector('.intro p').textContent = t('填写申请信息并完成两处签字，然后将 PDF 发给销售顾问。','Fill in the application, sign in both places, then send the PDF to your sales consultant.');
  document.querySelector('.writing-guide').textContent = writingGuide();
  document.querySelector('aside').setAttribute('aria-label',t('填写进度','Application progress'));
  document.querySelector('.steps-label').textContent = t('申请进度','Application progress');
  document.querySelector('.privacy strong').textContent = t('资料保存在当前页面','Your information stays on this page');
  document.querySelector('.privacy p').textContent = t('关闭或刷新页面前，请先保存 PDF。','Save the PDF before closing or reloading this page.');
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed',String(button.dataset.language === language));
  }
  for (const update of localized) update();
  for (const control of controls.values()) control.setCustomValidity('');
  render(false);
}

for (const button of document.querySelectorAll('[data-language]')) {
  button.addEventListener('click',()=> {
    if (language !== button.dataset.language) setLanguage(button.dataset.language);
  });
}
setLanguage(navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en');
