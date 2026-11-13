(function () {
  'use strict';

  var speakerDescriptions = {
    gabin: 'CT Gabin Nyingika — psychologue, DIRAC et assistant à la faculté de psychologie de l’Université de Kolwezi.',
    nadege: 'Docteur Nadège Tshinate — fondatrice de Mwinue Asimame.',
    rachelle: 'Docteur Rachelle Kabongo — cofondatrice de Mwinue Asimame.',
    anne: 'Mme Marie Anne Mazangu — Responsable de la maintenance à Kamoa Copper.',
    mami: 'Maître Mami Onenda — avocate inscrite aux barreaux du Haut-Katanga et du Lualaba.',
    eliane: 'Mme Eliane Mbosso — RH à MUMI, fondatrice et présidente du Centre de Soutien Kiese.',
    gauthier: 'M. Gauthier Moma — écrivain de « Miracle en sourdine ».',
    rosette: 'Psychologue Rosette Disashi — directrice chez Help Me Group.'
  };

  var campaigns = {
    octRose: {
      category: 'Santé',
      role: 'Organisation : Mwinue Asimame',
      date: '20 octobre 2026',
      theme: 'Octobre Rose 2026 · Cancer du sein',
      title: 'Octobre Rose 2026 : sensibiliser pour mieux prévenir',
      description: 'Le 20 octobre 2026, Mwinue Asimame a mené une action de sensibilisation au cancer du sein avec la commune de Manika et le Centre de Diagnostic Eyano. La campagne a mis en lumière l’importance de la prévention, du dépistage précoce et de l’accès à une information et à des soins adaptés.',
      storyTitle: 'Sensibiliser et encourager la prévention',
      story1: 'Les échanges de proximité ont permis d’aborder le cancer du sein et l’importance de demander conseil à des professionnels de santé.',
      story2: 'La commune de Manika et le Centre de Diagnostic Eyano ont accompagné cette action de sensibilisation.',
      closing: 'La sensibilisation et le dépistage précoce contribuent à faire de la santé des femmes une priorité.',
      facts: ['20 octobre 2026', 'Commune de Manika', 'Centre de Diagnostic Eyano'],
      tags: ['Santé', 'Cancer du sein', 'Octobre Rose']
    },
    associationSante: {
      category: 'Santé',
      role: 'Participation de Mwinue Asimame',
      date: '6 novembre 2026',
      theme: 'Unis contre les cancers : de la sensibilisation à l’action, pour la prévention, le dépistage précoce et une meilleure prise en charge des cancers chez la femme, l’homme et l’enfant',
      title: "Avec l'association des femmes professionnelles de la santé",
      description: 'Le 6 novembre 2026, le Ministère Provincial de la Santé, Éducation, Affaires Sociales et Humanitaires, Genre, Famille et Enfant a convié le public à une matinée de lutte contre les cancers à Kampi Ya Boma, sous le haut patronage de Son Excellence Madame la Gouverneure de la Province du Lualaba. Mwinue Asimame a pris part à cette activité et y a rencontré l’association des femmes professionnelles de la santé.',
      storyTitle: 'Une matinée provinciale de lutte contre les cancers',
      story1: 'Placée sous le thème « Unis contre les cancers : de la sensibilisation à l’action, pour la prévention, le dépistage précoce et une meilleure prise en charge des cancers chez la femme, l’homme et l’enfant », la matinée était organisée par le Ministère Provincial sous le haut patronage de Son Excellence Madame la Gouverneure du Lualaba.',
      story2: 'Le programme annonçait des interventions du Dr Cephas (HPK) sur les cancers pédiatriques, du Dr Hugue NGWEJ (UNIKOL) sur le cancer du col de l’utérus, du Dr Ernest MII (UNIKOL) sur le cancer du sein, du Dr Michel KAWELA (UNIKOL) sur le cancer de la prostate et du Dr Yvette KADIADIA (Asbl EBSP) sur les défis du dépistage au Lualaba. Le CNLC Lualaba devait intervenir sur les mythes liés aux cancers et présenter une synthèse des activités; le CT Nyingika, sur l’hygiène mentale et l’accompagnement psychosocial et socio-affectif. Mwinue Asimame a également rencontré l’association des femmes professionnelles de la santé à cette activité.',
      closing: 'La matinée était organisée par le Ministère Provincial, sous le haut patronage de la Gouverneure du Lualaba. La rencontre avec l’association des femmes professionnelles de la santé s’est tenue dans le cadre de cette activité.',
      facts: ['Date : 6 novembre 2026', 'Lieu : Kampi Ya Boma', 'Organisateur : Ministère Provincial du Lualaba'],
      tags: ['3 mois', '3 couleurs', 'Prévention'],
      ribbons: true
    },
    santeMentale: {
      category: 'Autonomisation',
      role: 'Organisation : Mwinue Asimame',
      date: '29 août 2026',
      theme: 'La santé mentale',
      title: 'Toujours forte... Mais à quel prix ?',
      description: 'Le 29 août 2026, Mwinue Asimame a organisé « Toujours forte... Mais à quel prix ? », une rencontre consacrée à la santé mentale des femmes et aux pressions qu’elles portent souvent en silence. Les échanges, les conseils pratiques, l’atelier de peinture et le moment de networking ont encouragé les participantes à retrouver leur équilibre et à prendre soin d’elles-mêmes.',
      storyTitle: 'Prendre soin de la santé mentale',
      story1: 'La rencontre a offert un espace d’écoute et de partage pour parler de santé mentale, reconnaître les réalités vécues par les femmes et réfléchir à des pistes pour préserver leur bien-être.',
      story2: 'Les échanges, les conseils pratiques, l’atelier de peinture et le moment de networking ont encouragé les participantes à retrouver leur équilibre et à prendre soin d’elles-mêmes.',
      closing: 'La santé mentale mérite une attention et un accompagnement adaptés au quotidien des femmes.',
      facts: ['29 août 2026', 'CT Gabin Nyingika · Psychologue', 'Nadège Tshinate · Fondatrice'],
      tags: ['Autonomisation', 'Santé mentale', 'Bien-être'],
      speakers: ['gabin', 'nadege', 'rachelle', 'anne']
    },
    droitSante: {
      category: 'Droits',
      role: 'Organisation : Mwinue Asimame',
      date: '21 mars 2026',
      theme: 'Droit à la santé des femmes',
      title: 'La santé de la femme, qui décide vraiment ?',
      description: 'Le 21 mars 2026, Mwinue Asimame a organisé « La santé de la femme, qui décide vraiment ? », une rencontre consacrée au droit des femmes de prendre des décisions éclairées concernant leur santé. Les échanges ont porté sur l’information, l’écoute et la liberté de choix.',
      storyTitle: 'Informer les femmes sur leur droit à la santé',
      story1: 'Cette activité a ouvert un espace de dialogue sur le droit des femmes à être informées, écoutées et actrices des décisions qui concernent leur santé.',
      story2: 'Cette rencontre a abordé le droit des femmes de prendre des décisions éclairées et libres concernant leur santé.',
      closing: 'Être informée, écoutée et libre de ses choix fait partie du droit des femmes à la santé.',
      facts: ['21 mars 2026', 'Droit à la santé', 'Centre de Soutien Kiese'],
      tags: ['Droits', 'Droit à la santé', 'Information'],
      speakers: ['mami', 'nadege', 'rachelle', 'eliane', 'gauthier']
    },
    violencesConjugales: {
      category: 'Droits',
      role: 'Organisation : Mwinue Asimame',
      date: '8 juin 2026',
      theme: 'Webinaire sur les violences conjugales',
      title: 'Quand l’amour fait mal : comprendre les violences conjugales pour protéger sa santé, sa dignité et sa vie',
      description: 'Le 8 juin 2026, Mwinue Asimame a tenu sur Zoom le webinaire « Quand l’amour fait mal : comprendre les violences conjugales pour protéger sa santé, sa dignité et sa vie ». L’activité a sensibilisé aux conséquences des violences conjugales et aux moyens de protéger les droits, la santé et la dignité des femmes.',
      storyTitle: 'Comprendre les violences conjugales pour protéger les femmes',
      story1: 'Le webinaire a abordé la reconnaissance des violences conjugales, leurs conséquences sur la santé et la dignité, ainsi que les moyens de protection.',
      story2: 'Avocats.cd a accompagné Mwinue Asimame dans la tenue de ce webinaire en ligne.',
      closing: 'Informer, écouter et orienter les femmes contribue à protéger leur santé, leur dignité et leur vie.',
      facts: ['8 juin 2026 · Zoom', 'Maître Mami Onenda · Avocate', 'Rosette Disashi · Help Me Group'],
      tags: ['Droits', 'Violences conjugales', 'Webinaire'],
      speakers: ['mami', 'rosette', 'nadege'],
      partnerUrl: 'https://avocats.cd/evenement/theme-quand-lamour-fait-mal-comprendre-les-violences-conjugales-pour-proteger-sa-sante-sa-dignite-et-sa-vie',
      partnerLabel: 'Consulter la page du webinaire accompagné par Avocats.cd'
    }
  };

  var photos = [
    {
      id: 'sante-1',
      image: 'img/galerie/sante/1.jpeg',
      campaign: 'octRose',
      alt: 'Action d’information sur le cancer du sein pendant Octobre Rose'
    },
    {
      id: 'droits-1',
      image: 'img/galerie/droits/1.jpeg',
      campaign: 'santeMentale',
      alt: 'Intervenante lors d’un échange sur la santé mentale'
    },
    {
      id: 'formations-1',
      image: 'img/galerie/formations/1.jpeg',
      campaign: 'droitSante',
      alt: 'Échange sur le droit des femmes à la santé et à l’information'
    },
    {
      id: 'droits-2',
      image: 'img/galerie/droits/2.jpeg',
      campaign: 'santeMentale',
      alt: 'Participante à une rencontre autour de la santé mentale'
    },
    {
      id: 'sante-2',
      image: 'img/galerie/sante/2.jpeg',
      campaign: 'octRose',
      alt: 'Échanges de prévention autour du cancer du sein'
    },
    {
      id: 'formations-2',
      image: 'img/galerie/formations/2.jpeg',
      campaign: 'droitSante',
      alt: 'Échange autour de l’accès des femmes à une information de santé'
    },
    {
      id: 'droits-3',
      image: 'img/galerie/droits/3.jpeg',
      campaign: 'santeMentale',
      alt: 'Femmes réunies pour échanger autour de la santé mentale'
    },
    {
      id: 'sante-3',
      image: 'img/galerie/sante/3.jpeg',
      campaign: 'octRose',
      alt: 'Campagne Octobre Rose sur le droit à la santé'
    },
    {
      id: 'formations-3',
      image: 'img/galerie/formations/3.jpeg',
      campaign: 'droitSante',
      alt: 'Échange sur les droits des femmes en matière de santé'
    },
    {
      id: 'sante-4',
      image: 'img/galerie/sante/4.jpeg',
      campaign: 'associationSante',
      alt: 'Association des femmes professionnelles de la santé'
    },
    {
      id: 'droits-4',
      image: 'img/galerie/droits/4.jpeg',
      campaign: 'santeMentale',
      alt: 'Participante à une rencontre sur la santé mentale'
    },
    {
      id: 'violences-1',
      image: "img/evenement/quand-l'amour-fait-mal.jpeg",
      campaign: 'violencesConjugales',
      alt: 'Webinaire Quand l’amour fait mal sur les violences conjugales'
    },
    {
      id: 'droits-6',
      image: 'img/galerie/droits/6.jpeg',
      campaign: 'santeMentale',
      alt: 'Participante lors d’un échange sur la santé mentale'
    },
    {
      id: 'sante-5',
      image: 'img/galerie/sante/5.jpeg',
      campaign: 'octRose',
      alt: 'Mobilisation Octobre Rose contre le cancer du sein'
    },
    {
      id: 'sante-6',
      image: 'img/galerie/sante/6.jpeg',
      campaign: 'octRose',
      alt: 'Mobilisation Octobre Rose contre le cancer du sein'
    },
    {
      id: 'droits-7',
      image: 'img/galerie/droits/7.jpeg',
      campaign: 'santeMentale',
      alt: 'Participante lors d’un échange autour de la santé mentale'
    },
    {
      id: 'droits-5',
      image: 'img/galerie/droits/5.jpeg',
      campaign: 'santeMentale',
      alt: 'Échange entre participantes autour de la santé mentale'
    },
    {
      id: 'droits-8',
      image: 'img/galerie/droits/8.jpeg',
      campaign: 'santeMentale',
      alt: 'Participante lors d’un échange autour de la santé mentale'
    },
    {
      id: 'droits-9',
      image: 'img/galerie/droits/9.jpeg',
      campaign: 'santeMentale',
      alt: 'Participante lors d’un échange autour de la santé mentale'
    },
    {
      id: 'droits-10',
      image: 'img/galerie/droits/10.jpeg',
      campaign: 'santeMentale',
      alt: 'Rencontre consacrée à la santé mentale des femmes'
    },
    {
      id: 'droits-11',
      image: 'img/galerie/droits/11.jpeg',
      campaign: 'santeMentale',
      alt: 'Échange sur la santé mentale et le bien-être des femmes'
    },
    {
      id: 'droits-12',
      image: 'img/galerie/droits/12.jpeg',
      campaign: 'santeMentale',
      alt: 'Temps de partage autour de la santé mentale'
    },
    {
      id: 'droits-13',
      image: 'img/galerie/droits/13.jpeg',
      campaign: 'santeMentale',
      alt: 'Sensibilisation à la santé mentale des femmes'
    },
    {
      id: 'droits-14',
      image: 'img/galerie/droits/14.jpeg',
      campaign: 'santeMentale',
      alt: 'Échange pour prendre soin de sa santé mentale'
    },
    {
      id: 'droits-15',
      image: 'img/galerie/droits/15.jpeg',
      campaign: 'santeMentale',
      alt: 'Participation à une activité sur la santé mentale'
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

  document.title = campaign.title + ' — Galerie Mwinue Asimame';
  document.getElementById('photoDescription').content = campaign.description;
  document.getElementById('photoPageTitle').textContent = campaign.title;
  document.getElementById('photoBreadcrumb').textContent = campaign.title;
  document.getElementById('photoRole').textContent = campaign.role;
  document.getElementById('photoCategory').textContent = campaign.category;
  document.getElementById('photoDate').textContent = campaign.date;
  document.getElementById('photoTheme').textContent = campaign.theme;
  document.getElementById('photoImage').src = photo.image;
  document.getElementById('photoImage').alt = photo.alt;
  document.getElementById('photoEyebrow').textContent = campaign.category;
  document.getElementById('photoTitle').textContent = campaign.title;
  document.getElementById('photoIntro').textContent = campaign.description;
  document.getElementById('photoSectionEyebrow').textContent = 'Réalisation associée';
  document.getElementById('photoSectionTitle').textContent = campaign.storyTitle;
  document.getElementById('photoStory1').textContent = campaign.story1;
  document.getElementById('photoStory2').textContent = campaign.story2;
  var speakersSection = document.getElementById('photoSpeakersSection');
  var speakersList = document.getElementById('photoSpeakers');
  speakersSection.hidden = !campaign.speakers || campaign.speakers.length === 0;
  speakersList.replaceChildren();
  (campaign.speakers || []).forEach(function (speaker) {
    var item = document.createElement('li');
    item.textContent = speakerDescriptions[speaker];
    speakersList.appendChild(item);
  });
  document.getElementById('photoRibbonsSection').hidden = !campaign.ribbons;
  document.getElementById('photoPartnerLink').hidden = !campaign.partnerUrl;
  if (campaign.partnerUrl) {
    document.getElementById('photoPartnerLink').href = campaign.partnerUrl;
    document.getElementById('photoPartnerLink').textContent = campaign.partnerLabel;
  }
  document.getElementById('photoClosing').textContent = campaign.closing;
  document.getElementById('photoFact1').firstChild.textContent = campaign.facts[0] + ' ';
  document.getElementById('photoFact2').firstChild.textContent = campaign.facts[1] + ' ';
  document.getElementById('photoFact3').firstChild.textContent = campaign.facts[2] + ' ';
  document.getElementById('photoTag1').textContent = campaign.tags[0];
  document.getElementById('photoTag2').textContent = campaign.tags[1];
  document.getElementById('photoTag3').textContent = campaign.tags[2];

  document.getElementById('previousPhoto').href = 'portfolio-single.html?photo=' + previousPhoto.id;
  document.getElementById('previousPhotoTitle').textContent = campaigns[previousPhoto.campaign].title;
  document.getElementById('nextPhoto').href = 'portfolio-single.html?photo=' + nextPhoto.id;
  document.getElementById('nextPhotoTitle').textContent = campaigns[nextPhoto.campaign].title;
})();
