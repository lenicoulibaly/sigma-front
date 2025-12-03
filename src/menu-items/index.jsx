import dashboard from './dashboard';
import application from './application';
import administration from './administration';
import associations from './associations';
import projects from './projects';
import immobilier from './immobilier';
import comptabilite from './comptabilite';
import forms from './forms';
import elements from './elements';
import samplePage from './sample-page';
import pages from './pages';
import utilities from './utilities';
import support from './support';
import other from './other';

// ==============================|| MENU ITEMS ||============================== //

// Add hidden property to items that should be hidden
application.hidden = true;
forms.hidden = true;
elements.hidden = true;
samplePage.hidden = true;
pages.hidden = true;
utilities.hidden = true;
support.hidden = true;
other.hidden = true;
associations.hidden = false;
projects.hidden = true;
immobilier.hidden = true;
comptabilite.hidden = true;


const menuItems = {
    items: [dashboard, application, associations, projects, immobilier, comptabilite, administration, forms, elements, samplePage, pages, utilities, support, other]
};

export default menuItems;
