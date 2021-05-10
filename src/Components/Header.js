import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import logo from '../logo.svg';

const useStyles = makeStyles((theme) => ({
  header: {
    backgroundColor: '#282c34',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
}));

const Header = () => {
  const classes = useStyles();

  return (
    <header className={classes.header}>
      {/* Learn more about BCH! */}
      <br />
      <a
        className="App-link"
        href="https://bch.info"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={logo}
          className="App-logo"
          alt="logo"
          width="30%"
          height="30%"
        />
      </a>
    </header>
  );
};

export default Header;
