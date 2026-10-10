import { simulate, format } from '../simulator.js';
import { COMPLETE_KEYWORD, LIFF_ID } from '../config.js';

const $ = (selector) => document.querySelector(selector);

const inputs = {
  adBudget: $('#ad-budget'),
  closeRate: $('#close-rate'),
  unitPrice: $('#unit-price'),
  shopName: $('#shop-name'),
  area: $('#area'),
};
const banner = $('#banner');
const formError = $('#form-error');
const submitBtn = $('#submit-btn');
const inputView = $('#input-view');
const resultView = $('#result-view');

// トーク画面から開かれ、ユーザー発言として送信できるか
let canSend = false;
let sending = false;

function showBanner(text, kind = '') {
  banner.textContent = text;
  banner.hidden = !text;
  banner.className = kind ? `banner is-${kind}` : 'banner';
}

async function setupLiff() {
  if (!window.liff) {
    showBanner('LINEの読み込みに失敗しました。通信環境をご確認ください。', 'error');
    return;
  }
  try {
    await liff.init({ liffId: LIFF_ID });
  } catch (error) {
    showBanner(`LIFFの初期化に失敗しました（${error.message}）`, 'error');
    return;
  }
  // sendMessages はトーク（1:1・グループ・トークルーム）から起動した場合のみ使える
  canSend = liff.isInClient() && ['utou', 'group', 'room'].includes(liff.getContext()?.type);
  if (!canSend) {
    showBanner('LINEのトーク画面から開いていないため、結果の表示のみ行います。');
  }
}

function isWholeMan(raw) {
  const n = Number(raw);
  return raw !== '' && Number.isInteger(n) && n > 0;
}

// 入力を検証し、正しければ計算用の値を、誤りがあれば null を返す
function readForm() {
  const budget = inputs.adBudget.value;
  const rate = inputs.closeRate.value;
  const price = inputs.unitPrice.value;

  let message = '';
  if (rate !== '' && !(Number(rate) >= 0 && Number(rate) <= 100)) {
    message = '成約率は0〜100で入力してください。';
  } else if ((budget !== '' && !isWholeMan(budget)) || (price !== '' && !isWholeMan(price))) {
    message = '金額は万円単位の整数で入力してください。';
  }
  formError.textContent = message;
  formError.hidden = !message;

  const valid = !message && isWholeMan(budget) && rate !== '' && isWholeMan(price);
  submitBtn.disabled = !valid || sending;
  if (!valid) return null;

  return {
    adBudget: Number(budget) * 10000,
    closeRate: Number(rate),
    unitPrice: Number(price) * 10000,
  };
}

function toChatText(r) {
  const shopName = inputs.shopName.value.trim();
  const area = inputs.area.value.trim();
  const lines = ['【売上シミュレーション結果】'];
  if (shopName) lines.push(`店舗名：${shopName}`);
  if (area) lines.push(`エリア：${area}`);
  lines.push(
    '',
    `広告費：${format.yen(r.adBudget)}／月`,
    `成約率：${format.percent(r.closeRate)}`,
    `単価：${format.yen(r.unitPrice)}`,
    '',
    `見込み来店数：${format.people(r.visits)}`,
    `見込み成約数：${format.people(r.deals)}`,
    `見込み売上：${format.manYen(r.sales)}`,
    '',
    '※入力値をもとにした目安です。',
  );
  return lines.join('\n');
}

function showResult(r) {
  $('#out-visits').textContent = format.people(r.visits);
  $('#out-deals').textContent = format.people(r.deals);
  $('#out-budget').textContent = format.manYen(r.adBudget);
  $('#out-sales').textContent = format.manYen(r.sales);
  $('#out-conditions').textContent = `成約率 ${format.percent(r.closeRate)}／単価 ${format.yen(r.unitPrice)}`;
  inputView.hidden = true;
  resultView.hidden = false;
  window.scrollTo({ top: 0 });
}

for (const input of [inputs.adBudget, inputs.closeRate, inputs.unitPrice]) {
  input.addEventListener('input', readForm);
}

$('#sim-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = readForm();
  if (!values) return;

  const result = simulate(values);

  if (canSend) {
    sending = true;
    submitBtn.disabled = true;
    try {
      // 結果本文と完了キーワードをユーザー発言として送る。
      // キーワードに公式アカウントの応答メッセージが反応し、無料相談の案内が返る。
      await liff.sendMessages([
        { type: 'text', text: toChatText(result) },
        { type: 'text', text: COMPLETE_KEYWORD },
      ]);
      showBanner('結果をLINEのトークに送信しました。', 'success');
    } catch (error) {
      showBanner(`LINEへの送信に失敗しました（${error.message}）`, 'error');
    } finally {
      sending = false;
      readForm();
    }
  }

  showResult(result);
});

$('#retry-btn').addEventListener('click', () => {
  resultView.hidden = true;
  inputView.hidden = false;
  showBanner('');
  inputs.adBudget.focus();
});

$('#close-btn').addEventListener('click', () => {
  if (window.liff && liff.isInClient()) liff.closeWindow();
  else window.close();
});

setupLiff();
