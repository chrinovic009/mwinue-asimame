(function () {
  'use strict';

  var defaultArticle = 'octobre-rose-bilan-2026';
  window.currentArticleSlug = null;
  var articles = {
    'octobre-rose-realite': {
      title: 'Octobre Rose n’est pas le rose. C’est une réalité.',
      category: 'Sensibilisation',
      date: 'Octobre 2026',
      image: 'images/octobre/octobre-5.jpg',
      summary: 'Nous avons rappelé que derrière les rubans et les campagnes se cachent des femmes qui vivent l’anxiété, le doute ou la difficulté d’accéder aux soins. Le cancer du sein n’est pas un sujet décoratif : c’est une réalité qui mérite notre attention.',
      tags: ['Octobre Rose', 'Santé des femmes', 'Sensibilisation'],
      sections: [
        { type: 'paragraph', text: 'Derrière les rubans roses et les campagnes, il y a des femmes qui vivent avec des questions, des inquiétudes ou des difficultés d’accès aux soins. Le cancer du sein est une réalité qui mérite une information sérieuse et de l’attention.' },
        { type: 'heading', text: 'Faire de l’information une priorité' },
        { type: 'paragraph', text: 'Parler de la maladie sans la réduire à un symbole aide à rappeler l’importance de s’informer auprès de sources fiables et de demander conseil à un professionnel de santé en cas d’inquiétude.' },
        { type: 'paragraph', text: 'Octobre Rose est aussi l’occasion de poursuivre les échanges et de soutenir les femmes tout au long de l’année.' }
      ]
    },
    'voix-et-mobilisation': {
      title: 'Et si votre voix pouvait faire la différence ?',
      category: 'Mobilisation',
      date: 'Octobre 2026',
      image: 'images/octobre/octobre-4.jpg',
      summary: 'Merci à toutes celles qui se sont mobilisées. Votre participation a rendu visible une cause qui nous concerne toutes. L’information et l’accès aux soins comptent ; le cancer du sein ne doit ni être un tabou ni une fatalité.',
      tags: ['Octobre Rose', 'Mobilisation', 'Santé des femmes'],
      sections: [
        { type: 'paragraph', text: 'Merci à toutes celles et ceux qui ont participé à la campagne et relayé les messages. Chaque prise de parole contribue à faire connaître l’importance de la santé des femmes.' },
        { type: 'heading', text: 'Continuer à faire circuler l’information' },
        { type: 'paragraph', text: 'Parler de prévention, partager des informations fiables et encourager les échanges avec des professionnels de santé sont des gestes qui peuvent aider à briser le silence autour du cancer du sein.' },
        { type: 'paragraph', text: 'La mobilisation ne s’arrête pas à la fin d’une campagne : votre voix peut continuer à faire la différence.' }
      ]
    },
    'prevention-priorite': {
      title: 'Faire de la prévention une priorité',
      category: 'Partenariat',
      date: 'Octobre 2026',
      image: 'images/octobre/octobre-2.png',
      summary: 'Nous avons uni nos efforts avec le Centre de Diagnostic Eyano pour promouvoir le dépistage, renforcer la prévention et encourager les entreprises, institutions et partenaires à s’engager dans cette lutte.',
      tags: ['Prévention', 'Dépistage', 'Partenariat'],
      sections: [
        { type: 'paragraph', text: 'La prévention et le dépistage précoce demandent une information accessible et des actions concrètes. Mwinue Asimame et le Centre de Diagnostic Eyano ont uni leurs efforts pour promouvoir le dépistage.' },
        { type: 'heading', text: 'Agir ensemble pour la santé des femmes' },
        { type: 'paragraph', text: 'Cette initiative invite également les entreprises, les institutions et les partenaires à s’engager en faveur de la santé des femmes et à contribuer à la diffusion de messages de prévention.' },
        { type: 'paragraph', text: 'En cas d’inquiétude ou de changement inhabituel, demandez conseil à un professionnel de santé.' }
      ]
    },
    'octobre-rose-bilan-2026': {
      title: 'Octobre Rose : un mois s’achève, mais la lutte continue',
      category: 'Bilan final',
      date: 'Octobre 2026',
      image: 'images/resume_octobre2026/6.jpeg',
      summary: 'Merci à nos partenaires, intervenants et femmes mobilisées pour avoir fait de cette campagne un moment fort de sensibilisation et d’engagement. Octobre Rose prend fin, mais notre combat pour l’information, le dépistage et l’accès aux soins continue.',
      tags: ['Octobre Rose', 'Santé des femmes', 'Prévention', 'Information fiable'],
      sections: [
        { type: 'paragraph', text: 'Derrière les rubans roses et les campagnes de sensibilisation, il y a des femmes qui découvrent une anomalie, hésitent à consulter, craignent un diagnostic ou n’ont pas accès aux soins nécessaires. Le cancer du sein est une réalité qui mérite notre attention, notre courage et un engagement durable.', lead: true },
        { type: 'paragraph', text: 'Durant Octobre Rose 2026, Mwinue Asimame a voulu donner un sens concret au ruban rose : informer, éveiller les consciences et promouvoir la santé des femmes. Notre campagne virtuelle a invité chacune et chacun à partager le message, à parler de prévention et à rappeler que le cancer du sein ne doit être ni un tabou ni une fatalité.' },
        { type: 'heading', text: 'Des actions de sensibilisation et de proximité' },
        { type: 'paragraph', text: 'Nous sommes allés à la rencontre des femmes du marché Manika pour échanger et sensibiliser sur le cancer du sein. Nous avons également déconstruit des idées reçues et encouragé le recours à une information fiable ainsi qu’aux professionnels de santé en cas de doute.' },
        { type: 'paragraph', text: 'Parce que la prévention et le dépistage précoce nécessitent des actions concrètes, Mwinue Asimame et le Centre de Diagnostic Eyano ont uni leurs efforts pour promouvoir le dépistage. Nous avons aussi invité les entreprises, les institutions et les partenaires engagés pour la santé des femmes à se joindre à cette démarche.' },
        { type: 'heading', text: 'Merci pour votre mobilisation' },
        { type: 'paragraph', text: 'Nous exprimons notre profonde gratitude à toutes les personnes, structures et partenaires qui ont contribué à cette campagne : nos partenaires, nos intervenants, les femmes rencontrées et toutes celles et ceux qui ont relayé nos messages. De la campagne virtuelle aux échanges au marché Manika, chaque action a porté la même conviction : l’information, le dépistage précoce et l’accès aux soins peuvent sauver des vies.' },
        { type: 'alert', text: 'Octobre Rose prend fin, mais la lutte ne s’arrête pas au calendrier. Continuons à informer, sensibiliser, dépister et agir. La santé, la dignité et le bien-être des femmes sont un engagement de chaque jour.' },
        { type: 'paragraph', text: 'Mwinue Asimame — Former, Éveiller, Promouvoir.' }
      ]
    },
    'toujours-forte': {
      title: 'Toujours forte... Mais à quel prix ?',
      category: 'Article',
      date: '29 Août 2026',
      image: 'images/recents/recent-23.jpeg',
      summary: 'Un temps d’échange autour de la charge mentale des femmes et de conseils pratiques pour retrouver son équilibre, ponctué d’un atelier de peinture et d’un moment de networking.',
      tags: ['Santé mentale', 'Bien-être des femmes', 'Échanges'],
      sections: [
        { type: 'paragraph', text: 'Être toujours forte peut aussi peser. Cette rencontre a ouvert un espace d’échange autour de la charge mentale des femmes et des difficultés liées à la recherche d’équilibre.' },
        { type: 'heading', text: 'Prendre le temps de penser à soi' },
        { type: 'paragraph', text: 'Les participantes ont pu partager leurs expériences et découvrir des conseils pratiques pour prendre soin de leur bien-être. Un atelier de peinture et un moment de networking ont complété ce temps de rencontre.' },
        { type: 'paragraph', text: 'La santé et le bien-être des femmes méritent une attention qui ne se limite pas aux attentes placées sur elles.' }
      ]
    },
    'quand-amour-fait-mal': {
      title: 'Quand l’amour fait mal',
      category: 'Article',
      date: '08 Juin 2026',
      image: 'images/recents/recent-22.jpeg',
      summary: 'Une rencontre pour comprendre les violences conjugales et protéger la santé, la dignité et la vie des femmes : reconnaître les signes d’alerte, connaître ses droits et les moyens de protection, puis se reconstruire et aller de l’avant.',
      tags: ['Droits des femmes', 'Prévention', 'Protection'],
      sections: [
        { type: 'paragraph', text: 'Les violences conjugales touchent à la santé, à la dignité et à la sécurité des femmes. Une rencontre a permis d’aborder ce sujet et de rappeler l’importance de pouvoir en parler.' },
        { type: 'heading', text: 'Reconnaître et connaître ses droits' },
        { type: 'paragraph', text: 'Les échanges ont porté sur les signes d’alerte, les droits des femmes et les moyens de protection. Être mieux informée peut aider à chercher du soutien et à envisager des solutions.' },
        { type: 'paragraph', text: 'La reconstruction et la possibilité d’aller de l’avant font également partie du chemin. En situation de danger, contactez les services d’urgence ou les structures d’aide disponibles dans votre région.' }
      ]
    },
    'sante-femme-decide': {
      title: 'La santé de la femme, qui décide vraiment ?',
      category: 'Article',
      date: '21 Mars 2026',
      image: 'images/recents/mental.jpg',
      summary: 'Un échange sur les décisions qui concernent la santé des femmes, leur droit à être informées et écoutées, et l’importance de pouvoir faire des choix éclairés pour leur bien-être.',
      tags: ['Santé des femmes', 'Droits des femmes', 'Information'],
      sections: [
        { type: 'paragraph', text: 'Les décisions qui concernent la santé des femmes touchent à leur quotidien et à leur bien-être. Elles ont le droit d’être informées et écoutées.' },
        { type: 'heading', text: 'Des choix éclairés et une écoute attentive' },
        { type: 'paragraph', text: 'Les échanges ont rappelé l’importance de pouvoir poser des questions, accéder à une information compréhensible et prendre part aux décisions qui concernent sa santé.' },
        { type: 'paragraph', text: 'Chaque femme mérite le respect de ses choix et un accompagnement adapté à sa situation.' }
      ]
    }
  };

  var article = document.getElementById('article-title');
  var category = document.getElementById('article-category');
  var date = document.getElementById('article-date');
  var summary = document.getElementById('article-summary');
  var body = document.getElementById('article-body');
  var imageWrap = document.getElementById('article-image-wrap');
  var image = document.getElementById('article-image');
  var tagList = document.querySelector('#article-tag')?.parentElement;

  if (!article || !category || !date || !summary || !body || !imageWrap || !image) {
    return;
  }

  function renderArticle(slug) {
    var selected = articles[slug];
    if (!selected) {
      return false;
    }

    article.textContent = selected.title;
    category.textContent = selected.category + ' | Mwinue Asimame';
    date.textContent = selected.date;
    summary.textContent = selected.summary;
    document.title = selected.title + ' | Mwinue Asimame';

    image.src = selected.image;
    image.alt = selected.title;
    imageWrap.hidden = false;

    body.replaceChildren();
    selected.sections.forEach(function (section) {
      var element;
      if (section.type === 'heading') {
        element = document.createElement('h2');
        element.className = 'mb-3 mt-5';
      } else {
        element = document.createElement('p');
        if (section.type === 'alert') {
          element.className = 'alert alert-light border mb-4';
        } else if (section.lead) {
          element.className = 'lead';
        }
      }
      element.textContent = section.text;
      body.appendChild(element);
    });

    if (tagList) {
      tagList.replaceChildren();
      selected.tags.forEach(function (tagText) {
        var link = document.createElement('a');
        link.href = 'blog.html';
        link.className = 'tag-cloud-link';
        link.textContent = tagText;
        tagList.appendChild(link);
      });
    }

    window.currentArticleSlug = slug;
    document.dispatchEvent(new CustomEvent('article:ready', {
      detail: { slug: slug }
    }));
    return true;
  }

  var articleSlug = new URLSearchParams(window.location.search).get('article') || defaultArticle;
  if (!renderArticle(articleSlug)) {
    article.textContent = 'Actualité introuvable';
    category.textContent = 'Mwinue Asimame';
    summary.textContent = 'Cette actualité n’existe pas. Consultez la liste de nos actualités.';
    imageWrap.hidden = true;
    document.dispatchEvent(new CustomEvent('article:error'));
  }

}());
