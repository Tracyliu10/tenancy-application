let language = 'zh';
const localized = [];
const t = (zh, en) => language === 'en' ? en : zh;
const stageTitles = ['Property & lease','Applicant details','Contacts & payments','Declaration & signatures','Review & export'];
const stageLeads = [
  'Enter the property and lease details agreed with your sales consultant.',
  'Enter details for one applicant. Use the spelling shown on your identification.',
  'Enter your utility preference, emergency contacts and agreed payments.',
  'Read each set of terms and sign in both boxes with your finger or mouse.',
  'Review your details and signatures, then save or share your PDF with your sales consultant.',
];
const groupLabel = heading => t(...heading.split(' · '));
const signTitle = key => key === 'declaration'
  ? t('签字 1 · 申请声明','Signature 1 · Declaration')
  : t('签字 2 · 留房费条款','Signature 2 · Holding Fee');
const choices = {
  'Yes':'是', 'No':'否', 'Mr':'先生', 'Ms':'女士', 'Miss':'小姐', 'Mrs':'夫人', 'Other':'其他',
  'No — I will arrange my own utilities':'否，我会自行开通公用服务',
  'Yes — Please help me connect utilities':'是，请协助开通公用服务',
};
const optionLabel = value => value ? t(choices[value] || value,value) : t('请选择','Select an option');
const writingGuide = () => t(
  '请使用英文填写。姓名请按证件上的拉丁字母拼写，例如姓 Zhang、名 San。地址示例：12 George Street, Sydney NSW。证件号码、邮箱和电话请按原样填写。',
  'Use English for written answers. Enter names as shown on your ID, for example Surname: Zhang, Given name: San. Address example: 12 George Street, Sydney NSW. Keep ID numbers, email addresses and phone numbers as issued.'
);
function bindText(node, getText) {
  const update = () => { node.textContent = getText(); };
  localized.push(update);
  update();
  return node;
}
function translated(tag, getText, className) {
  return bindText(element(tag,'',className),getText);
}
