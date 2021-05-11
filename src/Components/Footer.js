import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  footer: {
    height: '50px',
    backgroundColor: '#282c34',
    color: 'white',
  },
  footerLink: {
    color: 'white',
  },
}));

const Footer = () => {
  const classes = useStyles();

  return (
    <footer className={classes.footer}>
      Based on{' '}
      <a
        className={classes.footerLink}
        href="https://github.com/jcramer/bitcore-lib-fun"
        target="_blank"
        rel="noopener noreferrer"
      >
        bitcore-lib-fun
      </a>
      .&nbsp;&nbsp; Sources on{' '}
      <a
        className={classes.footerLink}
        href="https://github.com/zh/spa-wallet"
        target="_blank"
        rel="noopener noreferrer"
      >
        Github
      </a>
      .
    </footer>
  );
};

export default Footer;
