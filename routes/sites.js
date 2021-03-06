/*
 * All routes for sites are defined here
 * Since this file is loaded in server.js
 *   these routes are mounted onto /sites
 */


// Promise.all([db.query(websitesQ, ...), db.query(categoriesQ, ...)]).then(([websitesData, categoriesData]) => { ...


const express = require('express');
const router  = express.Router();

const { getUserForOrganization } = require('../db/helpers/organizations/organization_users');


module.exports = (db) => {

  // Display all the websites
  router.get("/:organization_id/sites", (req, res) => {
    console.log("diplay sites get request");
    const orgId = [req.params.organization_id];
    const userId = req.session.user_id;
    console.log(orgId);

    // Promise.all([db.query(query1, siteId), db.query(query2)])
    //   .then(([data, cats, email]) => {
    //     const site = data.rows[0];
    //     const categories = cats.rows;

    //     console.log(data.rows);

    //         const templateVars = {
    //           site,
    //           orgId,
    //           categories,
    //           email,
    //         }

    //         res.render("site", templateVars);

    //   })


    let query1 = `SELECT categories.name AS category_name, websites.*  FROM websites JOIN categories ON categories.id=websites.category_id WHERE websites.organization_id=$1`;
    let query2 = `SELECT * FROM categories`;
    console.log(query1);

    const user = getUserForOrganization(db, userId, orgId[0]);

    Promise.all([db.query(query1, orgId), db.query(query2), user])
      .then(([data, cats, user]) => {
        const sites = data.rows;
        const categories = cats.rows;
        const email = user[0].email;
        const admin = user[0].admin_privileges;

        console.log("WHAT DOES USER give", user);
        console.log("EMAIL", email);
        console.log("ADMIN", admin);

        const templateVars = {
          sites,
          categories,
          orgId,
          email,
          admin,
        };
        return res.render("sites", templateVars);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // Add a new website
  router.post("/:organization_id/sites", (req, res) => {
    const record = req.body;
    const orgId = req.params.organization_id;
    console.log(record);
    console.log(record.category_id);
    console.log(orgId);

    const params = [orgId, record.category_id, record.name, record.username, record.password, record.email, record.login_url];
    const query = `INSERT INTO websites (organization_id, category_id, name, username, password, email, login_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;

    console.log(query);
    db.query(query, params)
      .then(data => {
        console.log(data.rows[0]);
        res.redirect(`/organization/${orgId}/sites`);
      })
      .catch(err => {
        console.log(err);
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // Deletes an entry
  router.post("/:organization_id/sites/:site/delete", (req, res) => {
    console.log(req.params.site);
    const siteId = [req.params.site];
    const orgId = req.params.organization_id;

    const query = `DELETE FROM websites WHERE id=$1`;
    console.log(query);

    db.query(query, siteId)
      .then(data => {
        console.log(data.rows[0]);
        res.redirect(`/organization/${orgId}/sites`);
      })
      .catch(err => {
        console.log(err);
        res
          .status(500)
          .json({ error: err.message });
      });

  });

  // Shows the details of a site so it can be updated
  router.get("/:organization_id/sites/:site", (req, res) => {
    console.log(`Req params site: ${req.params.site}`);
    const siteId = [req.params.site];
    const orgId = req.params.organization_id;
    const userId = req.session.user_id;

    const query1 = `SELECT * FROM websites WHERE id=$1`;
    const query2 = `SELECT * FROM categories`;

    console.log(`Query: ${query1}`);
    console.log(siteId);

    Promise.all([db.query(query1, siteId), db.query(query2), getUserForOrganization(db, userId, orgId)])
      .then(([data, cats, user]) => {
        const site = data.rows[0];
        const categories = cats.rows;
        const email = user[0].email;
        console.log(data.rows);

        const templateVars = {
          site,
          orgId,
          categories,
          email,
        };

        res.render("site", templateVars);

      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });



  });

  // Update a site entry
  router.post("/:organization_id/sites/:site/update", (req, res) => {
    console.log(req.body);
    site = [req.body];
    const orgId = req.params.organization_id;
    console.log(orgId);
    const params = [req.body.name, req.body.login_url, req.body.username, req.body.email, req.body.category, req.body.password, req.params.site];

    const query = `UPDATE websites SET name=$1, login_url=$2, username=$3, email=$4, category_id=$5, password=$6  WHERE id=$7 RETURNING *`;
    console.log(query);

    db.query(query, params)
      .then(data => {
        console.log(data.rows[0]);
        res.redirect(`/organization/${orgId}/sites`);
      })
      .catch(err => {
        console.log(err);
        res
          .status(500)
          .json({ error: err.message });
      });
  });




  return router;
};
