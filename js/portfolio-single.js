(function () {
  'use strict';

  var campaigns = {
    sante: {
      category: 'Santé',
      theme: 'Octobre Rose 2026 · Cancer du sein',
      storyTitle: 'Octobre Rose 2026 : sensibiliser pour mieux prévenir',
      story1: 'Tout au long du mois d’octobre, Mwinue Asimame s’est mobilisée autour de la lutte contre le cancer du sein. Les actions de sensibilisation et le partenariat avec le Centre de Diagnostic Eyano ont mis en lumière l’importance de la prévention et du dépistage précoce.',
      story2: 'La campagne rappelle l’importance de l’information, de l’accès aux soins et des échanges avec des professionnels de santé.',
      closing: 'La sensibilisation au cancer du sein contribue à faire de la santé des femmes une priorité.',
      facts: ['Octobre Rose 2026', 'Prévention', 'Centre de Diagnostic Eyano'],
      tags: ['Santé', 'Cancer du sein', 'Sensibilisation']
    },
    droits: {
      category: 'Droits',
      theme: 'Charge mentale des femmes',
      storyTitle: 'Toujours forte... Mais à quel prix ?',
      story1: 'Cette réalisation ouvre un espace d’échange sur la charge mentale et les pressions que les femmes portent souvent en silence. Les échanges, les conseils pratiques, l’atelier de peinture et le moment de networking ont encouragé les participantes à retrouver leur équilibre et à prendre soin d’elles-mêmes.',
      story2: 'Avec l’accompagnement du CT Gabin Nyingika, la rencontre a permis de reconnaître ces réalités et de partager des pistes pour préserver le bien-être des femmes.',
      closing: 'La charge mentale mérite d’être entendue et prise en compte dans le quotidien des femmes.',
      facts: ['Charge mentale', 'CT Gabin Nyingika', 'Bien-être des femmes'],
      tags: ['Droits', 'Charge mentale', 'Écoute']
    },
    formations: {
      category: 'Autonomisation',
      theme: 'Sensibilisation aux violences conjugales',
      storyTitle: 'Quand l’amour fait mal',
      story1: 'Cette réalisation sensibilise aux violences conjugales et à leurs conséquences sur la santé, la dignité et la vie des femmes. La rencontre a abordé la reconnaissance des signes d’alerte, les droits et les moyens de protection.',
      story2: 'Avec l’accompagnement de Maître Mamy Onenda, les échanges ont également évoqué les chemins possibles vers la reconstruction.',
      closing: 'Informer sur les violences conjugales, les droits et les moyens de protection contribue à soutenir les femmes.',
      facts: ['Violences conjugales', 'Maître Mamy Onenda', 'Droits et protection'],
      tags: ['Violences conjugales', 'Droits', 'Sensibilisation']
    }
  };

  var photos = [
    {
      id: 'sante-1',
      image: 'img/galerie/sante/1.jpeg',
      campaign: 'sante',
      title: 'Octobre Rose : informer pour prévenir le cancer du sein',
      alt: 'Action d’information sur le cancer du sein pendant Octobre Rose',
      intro: 'Cette photo s’inscrit dans la campagne Octobre Rose 2026 de Mwinue Asimame, consacrée à la prévention et à la sensibilisation au cancer du sein.'
    },
    {
      id: 'droits-1',
      image: 'img/galerie/droits/1.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : mettre des mots sur les pressions invisibles',
      alt: 'Intervenante lors d’un échange sur la charge mentale',
      intro: 'Cette image renvoie aux échanges de la rencontre « Toujours forte... Mais à quel prix ? », consacrée à la charge mentale des femmes.'
    },
    {
      id: 'formations-1',
      image: 'img/galerie/formations/1.jpeg',
      campaign: 'formations',
      title: 'Violences conjugales : reconnaître les signes d’alerte',
      alt: 'Intervention lors d’une rencontre de sensibilisation aux violences conjugales',
      intro: 'Cette photo s’inscrit dans la rencontre « Quand l’amour fait mal », consacrée à la sensibilisation aux violences conjugales.'
    },
    {
      id: 'droits-2',
      image: 'img/galerie/droits/2.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : écouter les expériences des femmes',
      alt: 'Participantes lors d’un échange autour de la charge mentale',
      intro: 'Cette image illustre le temps d’écoute et de partage proposé aux participantes autour de la charge mentale.'
    },
    {
      id: 'sante-2',
      image: 'img/galerie/sante/2.jpeg',
      campaign: 'sante',
      title: 'Cancer du sein : sensibiliser et encourager la prévention',
      alt: 'Échanges de prévention autour du cancer du sein',
      intro: 'Cette photo accompagne les échanges de la campagne Octobre Rose 2026 sur la prévention et le dépistage précoce du cancer du sein.'
    },
    {
      id: 'formations-2',
      image: 'img/galerie/formations/2.jpeg',
      campaign: 'formations',
      title: 'Violences conjugales : comprendre les signes d’alerte',
      alt: 'Échanges sur la prévention des violences conjugales',
      intro: 'Cette photo fait écho aux échanges de « Quand l’amour fait mal » sur la reconnaissance des signes d’alerte des violences conjugales.'
    },
    {
      id: 'droits-3',
      image: 'img/galerie/droits/3.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : faire une place à la parole des femmes',
      alt: 'Femmes réunies pour échanger autour de la charge mentale',
      intro: 'Cette photo se rapporte à l’espace de dialogue créé par « Toujours forte... Mais à quel prix ? » pour parler de la charge mentale.'
    },
    {
      id: 'sante-3',
      image: 'img/galerie/sante/3.jpeg',
      campaign: 'sante',
      title: 'Octobre Rose : notre santé, notre droit',
      alt: 'Visuel Octobre Rose sur le droit à la santé des femmes',
      intro: 'Le visuel Octobre Rose rappelle que la campagne porte aussi sur le droit des femmes à être informées et accompagnées face au cancer du sein.'
    },
    {
      id: 'formations-3',
      image: 'img/galerie/formations/3.jpeg',
      campaign: 'formations',
      title: 'Violences conjugales : connaître ses droits et se protéger',
      alt: 'Échanges sur les droits et la protection face aux violences conjugales',
      intro: 'Cette image se rattache à la réalisation « Quand l’amour fait mal », qui aborde les droits et les moyens de protection face aux violences conjugales.'
    },
    {
      id: 'sante-4',
      image: 'img/galerie/sante/4.jpeg',
      campaign: 'sante',
      title: "Avec l'association des femmes professionnelles de la santé",
      alt: 'Femmes professionnelles de la santé réunies lors d’une rencontre',
      intro: 'Cette photographie met en avant la rencontre avec l’association des femmes professionnelles de la santé, dans le contexte des actions de sensibilisation au cancer du sein.'
    },
    {
      id: 'droits-4',
      image: 'img/galerie/droits/4.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : reconnaître les pressions du quotidien',
      alt: 'Participante lors d’une rencontre sur la charge mentale',
      intro: 'Ce portrait témoigne de l’attention portée aux participantes de « Toujours forte... Mais à quel prix ? », une rencontre sur la charge mentale.'
    },
    {
      id: 'formations-4',
      image: 'img/galerie/formations/4.jpeg',
      campaign: 'formations',
      title: 'Violences conjugales : briser le silence et demander de l’aide',
      alt: 'Participante à une rencontre sur les violences conjugales',
      intro: 'Cette photo s’inscrit dans la sensibilisation menée lors de « Quand l’amour fait mal » et dans les échanges sur les moyens de protection.'
    },
    {
      id: 'droits-6',
      image: 'img/galerie/droits/6.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : échanger pour préserver son équilibre',
      alt: 'Participante lors d’un échange sur la charge mentale',
      intro: 'Cette image est liée aux échanges et aux conseils pratiques de la rencontre « Toujours forte... Mais à quel prix ? ».'
    },
    {
      id: 'sante-5',
      image: 'img/galerie/sante/5.jpeg',
      campaign: 'sante',
      title: 'Octobre Rose : se mobiliser contre le cancer du sein',
      alt: 'Mobilisation collective d’Octobre Rose contre le cancer du sein',
      intro: 'La mobilisation photographiée s’inscrit dans la campagne Octobre Rose 2026 de Mwinue Asimame contre le cancer du sein.'
    },
    {
      id: 'droits-7',
      image: 'img/galerie/droits/7.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : prendre soin de soi et retrouver l’équilibre',
      alt: 'Participante lors d’un échange autour de la charge mentale',
      intro: 'Cette photo rappelle l’objectif de la rencontre « Toujours forte... Mais à quel prix ? » : encourager les femmes à prendre soin d’elles-mêmes.'
    },
    {
      id: 'formations-6',
      image: 'img/galerie/formations/6.jpeg',
      campaign: 'formations',
      title: 'Quand l’amour fait mal : accompagner la reconstruction',
      alt: 'Groupe réuni lors d’une rencontre sur les violences conjugales',
      intro: 'Cette image renvoie aux échanges de « Quand l’amour fait mal » sur les violences conjugales et les chemins possibles vers la reconstruction.'
    },
    {
      id: 'droits-5',
      image: 'img/galerie/droits/5.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : partager des pistes pour se ressourcer',
      alt: 'Échange entre participantes autour de la charge mentale',
      intro: 'Cette photo se rapporte aux pistes et conseils pratiques partagés lors de la rencontre « Toujours forte... Mais à quel prix ? ».'
    },
    {
      id: 'formations-5',
      image: 'img/galerie/formations/5.jpeg',
      campaign: 'formations',
      title: 'Violences conjugales : agir pour la dignité et la reconstruction',
      alt: 'Groupe réuni pour échanger sur les violences conjugales',
      intro: 'Cette photo illustre l’initiative « Quand l’amour fait mal » et son engagement pour les droits, la protection et la dignité des femmes.'
    },
    {
      id: 'droits-8',
      image: 'img/galerie/droits/8.jpeg',
      campaign: 'droits',
      title: 'Charge mentale : sensibiliser aux réalités vécues',
      alt: 'Participante lors d’un échange autour de la charge mentale',
      intro: 'Cette image est liée à la sensibilisation et au partage d’expériences proposés par « Toujours forte... Mais à quel prix ? ».'
    }
  ];

  var requestedId = new URLSearchParams(window.location.search).get('photo');
  var currentIndex = photos.findIndex(function (photo) {
    return photo.id === requestedId;
  });

  if (currentIndex < 0) currentIndex = 0;

  var photo = photos[currentIndex];
  var campaign = campaigns[photo.campaign];
  var previousPhoto = photos[(currentIndex - 1 + photos.length) % photos.length];
  var nextPhoto = photos[(currentIndex + 1) % photos.length];

  document.title = photo.title + ' — Galerie Mwinue Asimame';
  document.getElementById('photoDescription').content = photo.intro;
  document.getElementById('photoPageTitle').textContent = photo.title;
  document.getElementById('photoBreadcrumb').textContent = photo.title;
  document.getElementById('photoCategory').textContent = campaign.category;
  document.getElementById('photoTheme').textContent = campaign.theme;
  document.getElementById('photoImage').src = photo.image;
  document.getElementById('photoImage').alt = photo.alt;
  document.getElementById('photoEyebrow').textContent = campaign.category;
  document.getElementById('photoTitle').textContent = photo.title;
  document.getElementById('photoIntro').textContent = photo.intro;
  document.getElementById('photoSectionEyebrow').textContent = 'Réalisation associée';
  document.getElementById('photoSectionTitle').textContent = campaign.storyTitle;
  document.getElementById('photoStory1').textContent = campaign.story1;
  document.getElementById('photoStory2').textContent = campaign.story2;
  document.getElementById('photoClosing').textContent = campaign.closing;
  document.getElementById('photoFact1').firstChild.textContent = campaign.facts[0] + ' ';
  document.getElementById('photoFact2').firstChild.textContent = campaign.facts[1] + ' ';
  document.getElementById('photoFact3').firstChild.textContent = campaign.facts[2] + ' ';
  document.getElementById('photoTag1').textContent = campaign.tags[0];
  document.getElementById('photoTag2').textContent = campaign.tags[1];
  document.getElementById('photoTag3').textContent = campaign.tags[2];

  document.getElementById('previousPhoto').href = 'portfolio-single.html?photo=' + previousPhoto.id;
  document.getElementById('previousPhotoTitle').textContent = previousPhoto.title;
  document.getElementById('nextPhoto').href = 'portfolio-single.html?photo=' + nextPhoto.id;
  document.getElementById('nextPhotoTitle').textContent = nextPhoto.title;
})();
