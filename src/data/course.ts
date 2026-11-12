import type { Lesson, Question, Unit } from "@/lib/course-types";
import type { Level } from "./levels";
import { chartUnit, cycleUnit, marketUnit, mindUnit, valueUnit } from "./course-more";
import { bondUnit, commodityUnit, newsUnit, planUnit, usUnit } from "./course-more2";

/**
 * 코스 콘텐츠. 개념 설명은 일반적으로 통용되는 설명 위주로 쓰고,
 * 과거 사건의 수치는 널리 알려진 것만 사용한다.
 */
const baseUnits: Unit[] = [
  {
    id: "basics",
    title: "주식 첫걸음",
    desc: "주식, 주가, 시가총액이 뭔지",
    icon: "Sprout",
    color: "#12b886",
    lessons: [
      {
        id: "basics-1",
        title: "주식이 뭐예요",
        questions: [
          {
            kind: "card",
            icon: "Pizza",
            title: "주식 = 회사의 한 조각",
            body: "회사를 피자라고 생각해보세요. 주식은 그 피자를 잘게 나눈 한 조각이에요.\n주식을 사면 그만큼 회사의 주인(주주)이 되고, 회사가 돈을 잘 벌면 내 조각의 가치도 올라가요.",
          },
          {
            kind: "choice",
            prompt: "주식을 산다는 건 무슨 뜻일까요?",
            options: ["회사에 돈을 빌려주는 것", "회사의 소유권 일부를 사는 것", "회사 제품을 미리 사는 것"],
            answer: 1,
            explain: "돈을 빌려주는 건 '채권'이에요. 주식은 소유권의 일부라서 회사의 성장과 위험을 같이 나눠요.",
          },
          {
            kind: "card",
            icon: "Gift",
            title: "주주가 돈을 버는 두 가지 방법",
            body: "① 시세차익: 싸게 사서 비싸게 팔기\n② 배당: 회사가 번 돈 일부를 주주에게 나눠주는 것",
          },
          {
            kind: "choice",
            prompt: "회사가 번 이익 일부를 주주에게 나눠주는 것을 뭐라고 할까요?",
            options: ["이자", "배당", "환급"],
            answer: 1,
            explain: "배당이에요. 은행 예금에서 받는 건 '이자'라고 불러요.",
          },
          {
            kind: "match",
            prompt: "용어와 뜻을 이어보세요",
            pairs: [
              ["주주", "주식을 가진 사람"],
              ["배당", "이익을 나눠주는 것"],
              ["채권", "돈을 빌려준 증서"],
            ],
          },
        ],
      },
      {
        id: "basics-2",
        title: "주가와 시가총액",
        questions: [
          {
            kind: "card",
            icon: "Scale",
            title: "주가는 '팔려는 사람'과 '사려는 사람'이 정해요",
            body: "사려는 사람이 많으면 더 비싸게라도 사려 하니 주가가 오르고, 팔려는 사람이 많으면 내려가요.\n한국 증시에서는 하루에 위아래로 최대 30%까지만 움직일 수 있어요(상한가·하한가).",
          },
          {
            kind: "card",
            icon: "Building2",
            title: "시가총액 = 회사의 몸값",
            body: "시가총액 = 주가 × 발행 주식 수\n주가만 보고 회사 크기를 비교하면 안 돼요. 주가 1만 원짜리 회사가 100만 원짜리 회사보다 클 수도 있어요.",
          },
          {
            kind: "choice",
            prompt: "A사는 주가 1만 원·주식 1억 주, B사는 주가 10만 원·주식 500만 주예요. 어느 회사가 더 클까요?",
            options: ["A사 (시총 1조 원)", "B사 (시총 5,000억 원)", "주가가 높은 B사"],
            answer: 0,
            explain: "A사 1만 원 × 1억 주 = 1조 원, B사 10만 원 × 500만 주 = 5,000억 원이에요. 회사 크기는 주가가 아니라 시가총액으로 비교해요.",
          },
          {
            kind: "choice",
            prompt: "한국 증시에서 하루에 주가가 오를 수 있는 최대 폭은?",
            options: ["10%", "30%", "제한 없음"],
            answer: 1,
            explain: "2015년부터 가격제한폭이 ±30%예요. 상한가는 +30%, 하한가는 -30%.",
          },
          {
            kind: "match",
            prompt: "국내 증시 색깔 관례를 맞춰보세요",
            pairs: [
              ["빨간색", "주가 상승"],
              ["파란색", "주가 하락"],
              ["상한가", "하루 +30%"],
            ],
            explain: "미국은 반대로 상승이 초록, 하락이 빨강이에요. 해외 앱을 볼 때 헷갈리지 마세요!",
          },
        ],
      },
      {
        id: "basics-3",
        title: "주가는 왜 움직일까",
        questions: [
          {
            kind: "card",
            icon: "Telescope",
            title: "주가는 '미래'를 미리 반영해요",
            body: "주가는 지금 얼마나 버는지보다 '앞으로 얼마나 벌지'에 대한 기대로 움직여요.\n그래서 좋은 소식이 나와도, 이미 다들 예상했던 소식이면 주가가 안 오를 수 있어요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "모두가 '이번 분기 실적이 엄청 좋을 것'이라고 예상해서 주가가 한 달간 40% 올랐어요. 실제 실적은 좋았지만 예상보다는 조금 못 미쳤어요.",
            prompt: "발표 다음 날 주가는 어떻게 됐을까요?",
            options: ["좋은 실적이니 오른다", "기대에 못 미쳐 내린다", "변화 없다"],
            answer: 1,
            explain: "주가에는 이미 '엄청 좋은 실적'이 반영돼 있었어요. 기대보다 못하면 실망 매물이 나와요. 이를 '어닝 쇼크'라고도 해요.",
          },
          {
            kind: "choice",
            prompt: "'소문에 사서 뉴스에 팔아라'라는 격언이 뜻하는 건?",
            options: [
              "뉴스는 믿을 수 없다",
              "기대감은 미리 주가에 반영되고, 확정되면 차익실현이 나온다",
              "소문은 항상 사실이다",
            ],
            answer: 1,
            explain: "기대감이 커질 때 주가가 미리 오르고, 막상 발표되면 '이제 더 오를 이유가 없다'며 파는 사람이 늘어나는 현상을 말해요.",
          },
          {
            kind: "match",
            prompt: "주가를 움직이는 힘을 이어보세요",
            pairs: [
              ["실적 기대 상승", "주가 상승 요인"],
              ["대규모 신주 발행", "주가 하락 요인"],
              ["예상과 같은 발표", "변화 적음"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "money",
    title: "돈의 흐름",
    desc: "금리·환율·물가가 주식에 미치는 영향",
    icon: "Banknote",
    color: "#3182f6",
    lessons: [
      {
        id: "money-1",
        title: "금리와 주식",
        questions: [
          {
            kind: "card",
            icon: "Landmark",
            title: "금리 = 돈의 가격",
            body: "금리가 오르면 은행 예금만으로도 이자를 많이 받으니, 굳이 위험한 주식을 살 이유가 줄어요.\n기업도 빌린 돈의 이자 부담이 커져요. 그래서 금리 인상은 보통 주식시장에 부담이에요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "미국 중앙은행(연준)이 시장 예상보다 큰 폭으로 기준금리를 올렸어요.",
            prompt: "주식시장은 보통 어떻게 반응할까요?",
            options: ["오른다", "내린다", "상관없다"],
            answer: 1,
            explain: "예상보다 큰 금리 인상은 '돈이 더 비싸진다'는 뜻이라 주가에 부담이에요. 핵심은 '예상보다'라는 점이에요. 예상과 같으면 반응이 작아요.",
          },
          {
            kind: "card",
            icon: "Rocket",
            title: "금리에 특히 약한 '성장주'",
            body: "성장주는 지금보다 먼 미래에 큰돈을 벌 거라는 기대로 비싸게 거래돼요.\n금리가 오르면 '먼 미래의 돈'의 현재 가치가 크게 줄어들어서, 성장주가 더 많이 빠지는 경향이 있어요.\n2022년 미국이 금리를 빠르게 올리자 기술주 중심의 나스닥 지수는 한 해 동안 30% 넘게 떨어졌어요.",
          },
          {
            kind: "choice",
            prompt: "금리가 빠르게 오를 때 상대적으로 더 크게 떨어지기 쉬운 주식은?",
            options: ["꾸준히 배당하는 은행주", "아직 적자지만 미래가 기대되는 기술 성장주", "생필품 회사 주식"],
            answer: 1,
            explain: "미래 기대에 기대는 성장주일수록 금리에 민감해요. 반대로 은행은 금리가 오르면 예대마진이 커져 상대적으로 덜 빠지기도 해요.",
          },
          {
            kind: "match",
            prompt: "금리 변화와 결과를 이어보세요",
            pairs: [
              ["금리 인상", "성장주 부담"],
              ["금리 인하", "증시에 돈이 몰림"],
              ["예상과 같은 결정", "반응 작음"],
            ],
          },
        ],
      },
      {
        id: "money-2",
        title: "환율과 수출주",
        questions: [
          {
            kind: "card",
            icon: "ArrowRightLeft",
            title: "환율이 오른다 = 원화가 약해진다",
            body: "1달러 = 1,200원 → 1,400원이 되면 '환율이 올랐다'고 해요. 같은 1달러를 사려면 원화가 더 필요하니 원화 가치가 떨어진 거예요.",
          },
          {
            kind: "choice",
            prompt: "환율이 오르면(원화 약세) 유리해지는 쪽은?",
            options: ["해외에 물건을 파는 수출 기업", "해외에서 원료를 사오는 기업", "해외여행 가는 사람"],
            answer: 0,
            explain: "똑같이 1달러어치를 팔아도 원화로 바꾸면 더 많은 돈이 들어와요. 반도체·자동차 같은 수출주에 유리하고, 원료를 수입하는 기업이나 해외여행자에게는 불리해요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "원/달러 환율이 빠르게 오르고 있어요(원화 약세). 외국인 투자자는 원화로 된 한국 주식을 들고 있어요.",
            prompt: "외국인 투자자는 어떻게 움직이기 쉬울까요?",
            options: ["한국 주식을 더 산다", "한국 주식을 판다", "아무 영향 없다"],
            answer: 1,
            explain: "주가가 그대로여도 원화 가치가 떨어지면 달러로 환산한 자산이 줄어요(환차손). 그래서 원화 약세가 가파를 때는 외국인 매도가 늘어나는 경우가 많아요.",
          },
          {
            kind: "match",
            prompt: "환율 상승(원화 약세)의 영향을 이어보세요",
            pairs: [
              ["수출 기업", "이익 증가"],
              ["수입 원료 기업", "비용 증가"],
              ["외국인 투자자", "환차손 우려"],
            ],
          },
        ],
      },
      {
        id: "money-3",
        title: "물가와 중앙은행",
        questions: [
          {
            kind: "card",
            icon: "ShoppingCart",
            title: "물가가 오르면 왜 주식이 떨어질까",
            body: "물가가 너무 빨리 오르면(인플레이션) 중앙은행은 금리를 올려서 돈을 거둬들여요.\n그래서 시장은 물가 지표(CPI)가 높게 나오면 '금리가 더 오르겠구나' 하고 미리 반응해요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "미국 소비자물가지수(CPI)가 시장 예상보다 높게 발표됐어요.",
            prompt: "주식시장의 첫 반응은?",
            options: ["경기가 좋다는 뜻이라 오른다", "금리 인상 우려로 내린다", "물가는 주식과 상관없다"],
            answer: 1,
            explain: "예상보다 높은 물가 → 중앙은행이 금리를 더 올리거나 오래 유지할 것 → 주식에 부담. 그래서 물가 발표일에 시장이 크게 출렁이곤 해요.",
          },
          {
            kind: "choice",
            prompt: "'나쁜 뉴스가 좋은 뉴스'라는 말이 나오는 상황은?",
            options: [
              "경기 지표가 약하게 나와 금리 인하 기대가 커질 때",
              "회사가 적자를 낼 때",
              "전쟁이 났을 때",
            ],
            answer: 0,
            explain: "금리가 높은 시기에는 경기가 살짝 식는다는 지표가 '이제 금리를 내리겠구나'라는 기대로 이어져 주가가 오르기도 해요. 단, 경기가 너무 나빠 보이면 침체 우려로 바뀌어요.",
          },
          {
            kind: "match",
            prompt: "흐름을 순서대로 이어보세요",
            pairs: [
              ["물가 급등", "금리 인상"],
              ["금리 인상", "대출·소비 위축"],
              ["소비 위축", "기업 실적 둔화"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "world",
    title: "국제 정세와 시장",
    desc: "전쟁·무역 갈등·글로벌 쇼크 때 시장이 왜 움직이는지",
    icon: "Globe",
    color: "#f59f00",
    lessons: [
      {
        id: "world-1",
        title: "전쟁과 유가",
        questions: [
          {
            kind: "card",
            icon: "Fuel",
            title: "지정학 위기 → 유가 → 물가 → 금리",
            body: "산유국 주변에서 분쟁이 생기면 원유 공급이 끊길까 봐 유가가 뛰어요.\n유가가 오르면 물가가 오르고, 물가가 오르면 금리 인상 압력이 생겨요. 국제 정세가 한국 주식까지 닿는 대표적인 경로예요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "2022년 2월, 러시아가 우크라이나를 침공했어요. 러시아는 세계 주요 원유·천연가스 수출국이에요.",
            prompt: "국제 유가는 어떻게 됐을까요?",
            options: ["급등", "급락", "그대로"],
            answer: 0,
            explain: "공급 차질 우려로 국제 유가는 배럴당 100달러를 넘어 한때 130달러대까지 치솟았어요. 이 에너지 가격 급등은 그해 전 세계 인플레이션과 금리 인상을 더 부채질했어요.",
          },
          {
            kind: "match",
            prompt: "유가 급등 때 업종별 영향을 이어보세요",
            pairs: [
              ["항공사", "연료비 부담 ↑"],
              ["정유·에너지", "수익 개선 기대"],
              ["방산", "국방비 증액 기대"],
            ],
            explain: "같은 뉴스라도 업종마다 반대로 움직여요. 위기 때 '누가 이득을 보고 누가 손해를 볼까'를 생각하는 게 핵심이에요.",
          },
          {
            kind: "card",
            icon: "ShieldCheck",
            title: "위기 때 돈이 몰리는 '안전자산'",
            body: "불안할 때 투자자들은 위험한 자산(주식, 신흥국 통화)을 팔고 안전자산으로 옮겨요.\n대표적인 안전자산: 달러, 금, 미국 국채.\n그래서 국제 위기가 터지면 원화는 약해지고(환율 상승) 금값은 오르는 경우가 많아요.",
          },
          {
            kind: "choice",
            prompt: "국제 분쟁 소식이 전해진 날, 함께 오르기 쉬운 것은?",
            options: ["신흥국 주식", "금 가격과 원/달러 환율", "항공주"],
            answer: 1,
            explain: "안전자산 선호 때문에 금과 달러가 강해지고, 달러가 강해지니 원/달러 환율도 오르기 쉬워요.",
          },
        ],
      },
      {
        id: "world-2",
        title: "무역 갈등과 공급망",
        questions: [
          {
            kind: "card",
            icon: "Ship",
            title: "한국은 '수출로 먹고사는 나라'",
            body: "한국 경제는 수출 비중이 커서, 큰 나라들끼리 관세를 올리며 싸우면 직접 피해를 보기 쉬워요.\n특히 미국과 중국은 한국의 가장 큰 수출 시장이라 두 나라의 갈등에 민감해요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "2018년, 미국과 중국이 서로의 수입품에 관세를 매기며 무역 분쟁이 격화됐어요.",
            prompt: "그해 한국 증시(코스피)는?",
            options: ["수혜로 크게 올랐다", "크게 떨어졌다", "영향이 없었다"],
            answer: 1,
            explain: "중국을 거쳐 미국으로 가는 중간재 수출이 많은 한국은 피해가 클 거라는 우려로 코스피가 그해 17% 가까이 떨어졌어요.",
          },
          {
            kind: "card",
            icon: "Wrench",
            title: "위기가 기회가 되는 종목도 있어요",
            body: "2019년 7월, 일본이 반도체 핵심 소재 3가지의 한국 수출을 규제했어요.\n반도체 대기업에는 악재였지만, 이 소재를 국산화할 수 있다고 기대받은 국내 소재·부품·장비(소부장) 기업들의 주가는 급등했어요.",
          },
          {
            kind: "choice",
            prompt: "공급망 갈등 뉴스가 나왔을 때 가장 먼저 해볼 질문은?",
            options: [
              "무조건 주식을 팔아야 하나?",
              "이 갈등으로 누가 손해를 보고, 누가 대신 수혜를 볼까?",
              "뉴스는 무시해도 될까?",
            ],
            answer: 1,
            explain: "같은 사건이 어떤 기업에는 악재, 다른 기업에는 호재예요. 공급이 막히면 '대신 공급할 수 있는 회사'를 찾는 게 시장의 반응이에요.",
          },
          {
            kind: "match",
            prompt: "사건과 시장 반응을 이어보세요",
            pairs: [
              ["미중 관세 전쟁", "수출주 약세"],
              ["일본 소재 수출 규제", "국산화 기대주 급등"],
              ["중동 분쟁", "유가 급등"],
            ],
          },
        ],
      },
      {
        id: "world-3",
        title: "글로벌 쇼크 읽기",
        questions: [
          {
            kind: "card",
            icon: "Waves",
            title: "한국 증시는 '글로벌 파도'를 같이 탄다",
            body: "외국인 투자자 비중이 크고 거래가 쉬운 한국 증시는, 해외에서 큰 충격이 오면 현금을 마련하려는 매도가 몰리기 쉬워요.\n그래서 '한국에는 별일이 없는데 왜 떨어지지?' 싶은 날이 생겨요.",
          },
          {
            kind: "choice",
            variant: "predict",
            scenario: "2024년 8월 초, 미국 고용 지표가 예상보다 나빠 경기 침체 우려가 커졌어요. 동시에 일본이 금리를 올리면서, 싼 엔화를 빌려 다른 자산에 투자하던 자금(엔 캐리 트레이드)이 한꺼번에 빠져나갔어요.",
            prompt: "8월 5일 코스피는 어떻게 됐을까요?",
            options: ["소폭 상승", "하루 만에 8% 넘게 폭락", "보합"],
            answer: 1,
            explain: "코스피는 하루에 8.77% 떨어지며 거래를 잠시 멈추는 서킷브레이커까지 발동됐어요. 한국 내부 악재가 아니라 글로벌 자금 이동이 만든 폭락이었어요.",
          },
          {
            kind: "choice",
            prompt: "그다음 날(8월 6일) 코스피는?",
            options: ["추가로 폭락했다", "3% 넘게 반등했다", "거래가 정지됐다"],
            answer: 1,
            explain: "공포가 과했다는 인식에 바로 3% 넘게 반등했어요. 급격한 쇼크 직후에는 이렇게 변동성이 양쪽으로 커지는 경우가 많아요.",
          },
          {
            kind: "card",
            icon: "ChartCandlestick",
            title: "공포는 짧고, 회복은 길게",
            body: "2020년 3월 코로나 확산 때 코스피는 1,450선까지 떨어졌지만, 각국이 돈을 풀자 빠르게 회복해 다음 해 1월 사상 처음 3,000을 넘었어요.\n모든 쇼크가 그렇진 않지만, 역사적으로 '모두가 공포에 질린 순간'이 오히려 기회였던 경우가 많아요.",
          },
          {
            kind: "match",
            prompt: "용어와 뜻을 이어보세요",
            pairs: [
              ["서킷브레이커", "급락 시 거래 일시 중단"],
              ["안전자산", "위기 때 돈이 몰리는 곳"],
              ["엔 캐리 트레이드", "싼 엔화로 빌려 투자"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "disclosure",
    title: "공시 읽기",
    desc: "회사가 직접 알리는 중요한 소식 해석하기",
    icon: "FileText",
    color: "#7048e8",
    lessons: [
      {
        id: "disclosure-1",
        title: "유상증자",
        questions: [
          {
            kind: "card",
            icon: "Megaphone",
            title: "공시 = 회사의 공식 발표",
            body: "상장회사는 주가에 영향을 줄 수 있는 중요한 일을 DART(전자공시시스템)에 반드시 알려야 해요.\n뉴스보다 먼저, 가장 정확하게 나오는 정보예요.",
          },
          {
            kind: "card",
            icon: "Divide",
            title: "유상증자 = 새 조각을 만들어 파는 것",
            body: "회사가 새 주식을 찍어 팔고 돈을 받아요. 조각 수가 늘어나니 ==기존 주주의 몫은 작아질 수 있어요.== 이걸 '희석'이라고 해요.\n그래서 볼 것은 두 가지: ① 얼마나 많이 늘리나(희석률) ② 그 돈을 어디에 쓰나(자금 용도).",
            figure: "dilution",
          },
          {
            kind: "find",
            problemId: "ro-01",
            prompt: "주식 수가 얼마나 늘어나는지 알려 주는 줄을 탭하세요",
            answerLabel: "신주 수",
            explain: "새로 찍는 주식이 기존의 32%예요. 주식이 늘면 회사 가치를 더 많은 주식이 나눠 가져서 내 몫이 줄어요. 이걸 '희석'이라고 해요.",
          },
          {
            kind: "match",
            prompt: "공시 용어와 뜻을 연결하세요",
            pairs: [
              ["유상증자", "새 주식을 발행해 돈을 받고 파는 것"],
              ["자사주 매입", "회사가 자기 주식을 시장에서 사들이는 것"],
              ["잠정실적", "결산 전에 미리 알리는 실적 추정치"],
              ["할인율", "새 주식을 시가보다 싸게 파는 비율"],
            ],
          },
          { kind: "disclosure", problemId: "ro-01" },
          {
            kind: "find",
            problemId: "ro-02",
            prompt: "누가 새 주식을 사는지 알려 주는 줄을 탭하세요",
            answerLabel: "배정 대상",
            explain: "제3자배정은 '누가 사느냐'가 핵심이에요. 대기업 같은 전략적 투자자가 사면 사업 협력 기대가 생겨 호재로 읽히기도 해요.",
          },
          { kind: "disclosure", problemId: "ro-02" },
          { kind: "disclosure", problemId: "ro-03" },
        ],
      },
      {
        id: "disclosure-2",
        title: "자사주",
        questions: [
          {
            kind: "card",
            icon: "Repeat",
            title: "자사주 매입 vs 처분",
            body: "매입: 회사가 자기 주식을 시장에서 사들임 → 보통 호재\n소각까지 하면 주식 수가 줄어 더 확실한 호재\n처분: 갖고 있던 자사주를 내다 팖 → 매물 부담으로 악재가 되기 쉬움",
          },
          {
            kind: "find",
            problemId: "bb-01",
            prompt: "사들인 주식을 어떻게 처리하는지 알려 주는 줄을 탭하세요",
            answerLabel: "취득 후 처리",
            explain: "'전량 소각'이면 주식 수 자체가 줄어 남은 주주의 몫이 커져요. 자사주 공시에서 가장 먼저 볼 줄이에요.",
          },
          { kind: "disclosure", problemId: "bb-01" },
          { kind: "disclosure", problemId: "bb-02" },
          { kind: "disclosure", problemId: "bb-03" },
        ],
      },
      {
        id: "disclosure-3",
        title: "실적 발표",
        questions: [
          {
            kind: "card",
            icon: "Target",
            title: "컨센서스를 기억하세요",
            body: "컨센서스 = 증권사 애널리스트들의 실적 예상치 평균.\n주가는 '작년보다 좋은가'보다 '예상보다 좋은가'에 반응해요.\n예상보다 훨씬 좋으면 어닝 서프라이즈, 못 미치면 어닝 쇼크.",
          },
          {
            kind: "find",
            problemId: "ea-02",
            prompt: "시장 기대와 비교한 결과가 적힌 줄을 탭하세요",
            answerLabel: "시장 예상치(컨센서스) 대비",
            explain: "작년보다 41% 늘었어도 예상보다 16% 못 미쳤어요. 주가는 '예상 대비'에 반응해요.",
          },
          { kind: "disclosure", problemId: "ea-01" },
          { kind: "disclosure", problemId: "ea-02" },
          { kind: "disclosure", problemId: "ea-03" },
        ],
      },
    ],
  },
];

const byId = (id: string) => baseUnits.find((u) => u.id === id)!;

/** 학습 순서: 주식 → 기업 → 돈과 경제 → 세계 → 실전 판단·원칙 */
export const units: Unit[] = [
  byId("basics"),
  marketUnit,
  chartUnit,
  valueUnit,
  byId("disclosure"),
  byId("money"),
  bondUnit,
  cycleUnit,
  usUnit,
  commodityUnit,
  byId("world"),
  newsUnit,
  mindUnit,
  planUnit,
];

/** 유닛 난이도 (경로 헤더에 배지로 표시) */
export const UNIT_LEVEL: Record<string, Level> = {
  basics: 1,
  market: 1,
  plan: 1,
  chart: 2,
  value: 2,
  disclosure: 2,
  money: 2,
  us: 2,
  news: 2,
  mind: 2,
  bond: 3,
  cycle: 3,
  commodity: 3,
  world: 3,
};

export const allLessons: (Lesson & { unit: Unit })[] = units.flatMap((u) =>
  u.lessons.map((l) => ({ ...l, unit: u })),
);

export const getLesson = (id: string) => allLessons.find((l) => l.id === id);

/** 복습 키(lessonId#index)로 문제 찾기 */
export function getQuestionByKey(key: string): Question | undefined {
  const [lessonId, idx] = key.split("#");
  return getLesson(lessonId)?.questions[Number(idx)];
}

const unitLevel = (lessonIndex: number) => UNIT_LEVEL[allLessons[lessonIndex].unit.id] ?? 1;

/**
 * 순서대로 잠금 해제: 이전 레슨을 끝내야 다음 레슨이 열린다.
 * 내 레벨보다 낮은 유닛은 건너뛸 수 있게 처음부터 열어두고, 다음 레슨의 잠금 조건에서도 '끝낸 것'으로 본다.
 */
export function isUnlocked(lessonId: string, completed: string[], level: Level | null = null) {
  const i = allLessons.findIndex((l) => l.id === lessonId);
  if (i <= 0 || completed.includes(lessonId)) return true;
  const lv = level ?? 1;
  if (unitLevel(i) < lv) return true;
  return completed.includes(allLessons[i - 1].id) || unitLevel(i - 1) < lv;
}

/** 지금 할 차례인 레슨: 내 레벨 이상인 유닛에서 아직 안 끝낸 첫 레슨 */
export function currentLesson(completed: string[], level: Level | null = null) {
  const lv = level ?? 1;
  return (
    allLessons.find((l, i) => !completed.includes(l.id) && unitLevel(i) >= lv) ??
    allLessons.find((l) => !completed.includes(l.id))
  );
}
